
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Request
from pymongo.errors import PyMongoError

from app.database.mongodb import get_database

from app.models.quiz import (
    QuizGenerationRequest,
    QuizGenerationResponse,
    QuizQuestion,
    QuizOption,
    QuizSubmissionRequest,
    QuizSubmissionResponse,
    QuestionFeedback,
)

from app.services.embeddings import generate_embedding
from app.services.vector_store import search_similar_chunks
from app.services.quiz_generator import generate_quiz_questions
from app.services.adaptive_difficulty import update_student_difficulty


router = APIRouter(
    prefix="/api/quizzes",
    tags=["Quiz Generation"],
)


def get_public_questions(questions: list[dict]) -> list[dict]:
    """
    Remove correct answers and explanations before displaying a quiz.
    """

    return [
        {
            "id": question["id"],
            "question": question["question"],
            "options": question["options"],
        }
        for question in questions
    ]


@router.post("/generate", response_model=QuizGenerationResponse)
async def create_quiz(request: QuizGenerationRequest, http_request: Request):

    try:
        # Step 1: Generate an embedding for the requested topic.
        query = f"{request.subject}: {request.topic}"
        query_embedding = generate_embedding(query)

        # Step 2: Retrieve relevant chunks from the selected document.
        retrieved_chunks = search_similar_chunks(
            query_embedding=query_embedding,
            top_k=request.top_k,
            document_id=request.document_id,
            owner_email=http_request.state.current_user["email"],
        )

        if not retrieved_chunks:
            raise HTTPException(
                status_code=404,
                detail="No learning material found for this document."
            )

        # Step 3: Build context from the retrieved chunks.
        context_parts = []

        for index, chunk in enumerate(retrieved_chunks, start=1):
            context_parts.append(
                f"[Source {index}]\n{chunk['document']}"
            )

        context = "\n\n".join(context_parts)

        # Step 4: Generate questions using Gemini.
        questions = await generate_quiz_questions(
            context=context,
            subject=request.subject,
            topic=request.topic,
            difficulty=request.difficulty,
            num_questions=request.num_questions,
        )

        # Step 5: Prepare source references.
        sources = [
            {
                "document_id": chunk["metadata"]["document_id"],
                "chunk_index": chunk["metadata"]["chunk_index"],
                "distance": chunk["distance"],
            }
            for chunk in retrieved_chunks
        ]

        created_at = datetime.now(timezone.utc)

        # Step 6: Store the quiz, including its private answer key.
        quiz_document = {
            "subject": request.subject,
            "topic": request.topic,
            "difficulty": request.difficulty,
            "document_id": request.document_id,
            "student_email": http_request.state.current_user["email"].lower(),
            "questions": questions,
            "sources": sources,
            "created_at": created_at,
            "attempts": [],
        }

        database = get_database()
        result = await database.quizzes.insert_one(quiz_document)

        # Step 7: Return questions without correct answers.
        return QuizGenerationResponse(
            quiz_id=str(result.inserted_id),
            subject=request.subject,
            topic=request.topic,
            difficulty=request.difficulty,
            num_questions=len(questions),
            questions=[
                QuizQuestion(
                    id=question["id"],
                    question=question["question"],
                    options=[
                        QuizOption(**option)
                        for option in question["options"]
                    ],
                )
                for question in questions
            ],
            sources=sources,
            created_at=created_at,
        )

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except PyMongoError as exc:
        import logging
        logging.getLogger("mentormind.quizzes").exception("Quiz database operation failed")
        raise HTTPException(
            status_code=503,
            detail="Quiz database operation failed.",
        ) from exc

    except Exception as exc:
        import logging
        logging.getLogger("mentormind.quizzes").exception("Quiz generation failed")
        raise HTTPException(
            status_code=502,
            detail="Quiz generation failed.",
        ) from exc


@router.get("/{quiz_id}")
async def get_quiz(quiz_id: str):

    try:
        object_id = ObjectId(quiz_id)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(
            status_code=400,
            detail="Invalid quiz ID.",
        ) from exc

    try:
        database = get_database()

        quiz = await database.quizzes.find_one(
            {"_id": object_id}
        )

        if not quiz:
            raise HTTPException(
                status_code=404,
                detail="Quiz not found.",
            )

        return {
            "quiz_id": str(quiz["_id"]),
            "subject": quiz["subject"],
            "topic": quiz["topic"],
            "difficulty": quiz["difficulty"],
            "num_questions": len(quiz["questions"]),
            "questions": get_public_questions(quiz["questions"]),
            "sources": quiz["sources"],
            "created_at": quiz["created_at"],
        }

    except HTTPException:
        raise

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Quiz database operation failed.",
        ) from exc


@router.post("/{quiz_id}/submit", response_model=QuizSubmissionResponse)
async def submit_quiz(
    quiz_id: str,
    request: QuizSubmissionRequest,
):

    try:
        object_id = ObjectId(quiz_id)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(
            status_code=400,
            detail="Invalid quiz ID.",
        ) from exc

    try:
        database = get_database()

        quiz = await database.quizzes.find_one(
            {"_id": object_id}
        )

        if not quiz:
            raise HTTPException(
                status_code=404,
                detail="Quiz not found.",
            )

        questions = quiz["questions"]
        question_ids = {question["id"] for question in questions}

        submitted_ids = [
            answer.question_id for answer in request.answers
        ]

        # Require exactly one answer for every quiz question.
        if len(submitted_ids) != len(set(submitted_ids)):
            raise HTTPException(
                status_code=400,
                detail="Duplicate question answers are not allowed.",
            )

        if set(submitted_ids) != question_ids:
            raise HTTPException(
                status_code=400,
                detail="Submit exactly one answer for every question.",
            )

        answer_map = {
            answer.question_id: answer.selected_option_id
            for answer in request.answers
        }

        correct_answers = 0
        feedback = []
        adaptive_evaluations = []

        # Step 1: Evaluate every submitted answer.
        for question in questions:

            question_id = question["id"]
            selected_option_id = answer_map[question_id]

            valid_option_ids = {
                option["id"] for option in question["options"]
            }

            if selected_option_id not in valid_option_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid option for question {question_id}.",
                )

            correct_option_id = question["correct_option_id"]
            is_correct = selected_option_id == correct_option_id

            if is_correct:
                correct_answers += 1
                evaluation = "correct"
            else:
                evaluation = "incorrect"

            adaptive_evaluations.append(evaluation)

            feedback.append(
                QuestionFeedback(
                    question_id=question_id,
                    selected_option_id=selected_option_id,
                    correct_option_id=correct_option_id,
                    is_correct=is_correct,
                    explanation=question["explanation"],
                )
            )

        total_questions = len(questions)
        incorrect_answers = total_questions - correct_answers

        score_percentage = round(
            (correct_answers / total_questions) * 100,
            2,
        )

        # Step 2: Update Phase 22 adaptive difficulty when an
        # email was supplied during quiz generation.
        adaptive_status = "not_requested"

        student_email = quiz.get("student_email")

        if student_email:
            try:
                for evaluation in adaptive_evaluations:
                    await update_student_difficulty(
                        email=student_email,
                        subject=quiz["subject"],
                        topic=quiz["topic"],
                        evaluation=evaluation,
                    )

                adaptive_status = "updated"

            except Exception as exc:
                import logging
                logging.getLogger("mentormind.quizzes").exception("Adaptive difficulty update failed")
                adaptive_status = "unavailable"

        # Step 3: Save the submission attempt.
        attempt = {
            "submitted_at": datetime.now(timezone.utc),
            "total_questions": total_questions,
            "correct_answers": correct_answers,
            "incorrect_answers": incorrect_answers,
            "score_percentage": score_percentage,
            "answers": [
                {
                    "question_id": answer.question_id,
                    "selected_option_id": answer.selected_option_id,
                }
                for answer in request.answers
            ],
        }

        await database.quizzes.update_one(
            {"_id": object_id},
            {"$push": {"attempts": attempt}},
        )

        return QuizSubmissionResponse(
            quiz_id=quiz_id,
            total_questions=total_questions,
            attempted_questions=len(request.answers),
            correct_answers=correct_answers,
            incorrect_answers=incorrect_answers,
            score_percentage=score_percentage,
            feedback=feedback,
            adaptive_status=adaptive_status,
        )

    except HTTPException:
        raise

    except PyMongoError as exc:
        import logging
        logging.getLogger("mentormind.quizzes").exception("Quiz submission database operation failed")
        raise HTTPException(
            status_code=503,
            detail="Quiz submission could not be saved.",
        ) from exc
