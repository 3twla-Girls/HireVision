from fastapi import UploadFile, HTTPException
from Module_2.Personality_Traits_Detection.model_utils import PersonalityPredictor
from Server.controllers.personality_mapping import TRAIT_MAPPING
import shutil, os


predictor = PersonalityPredictor(
    "Module_2/Personality_Traits_Detection/weights/personality_r3d_best.pth.zip"
)
print("PERSONALITY TRAITS MODEL WEIGHTS IS LOADED")
# -------------------- STEP 1: PER VIDEO --------------------


async def predict_personality_controller(file: UploadFile):
    if not file.filename.endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm')):
        raise HTTPException(status_code=400, detail="Invalid video format")

    temp_path = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        results = predictor.predict(temp_path)

        return {"status": "success", "traits": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


# -------------------- REPORT LOGIC --------------------

def categorize(score):
    if score < 0.4:
        return "negative"
    elif score < 0.6:
        return "moderate"
    else:
        return "positive"


def build_trait(trait, score):
    category = categorize(score)
    data = TRAIT_MAPPING[trait][category]

    return {
        "score": round(score, 2),
        "category": category,
        "label": data["label"],
        "hr_report": data["hr_insight"],
        "candidate_feedback": data["candidate_feedback"],
        "recommendation": data["recommendation"]
    }


def generate_personality_report(traits_dict):
    traits_output = {}
    hr_summary = []
    candidate_summary = []

    for trait, score in traits_dict.items():
        trait_data = build_trait(trait, score)
        traits_output[trait] = trait_data

        hr_summary.append(trait_data["hr_report"])
        candidate_summary.append(trait_data["candidate_feedback"])

    return {
        "traits": traits_output,
        "hr_view": {"summary": hr_summary},
        "candidate_view": {"summary": candidate_summary}
    }


# -------------------- OVERALL --------------------

def aggregate_traits(traits_list):
    aggregated = {}

    for traits in traits_list:
        for trait, score in traits.items():
            aggregated.setdefault(trait, []).append(score)

    return {t: sum(v)/len(v) for t, v in aggregated.items()}


def get_dominant_traits(avg_traits):
    return sorted(avg_traits, key=avg_traits.get, reverse=True)[:2]


def generate_hr_decision(traits):
    if traits["Conscientiousness"] > 0.65 and traits["Neuroticism"] < 0.4:
        return "Strong Hire"
    elif traits["Conscientiousness"] > 0.5:
        return "Consider"
    return "Reject"


def generate_overall_report(traits_list):
    avg_traits = aggregate_traits(traits_list)

    base = generate_personality_report(avg_traits)

    base["summary"] = {
        "dominant_traits": get_dominant_traits(avg_traits),
        "average_scores": avg_traits
    }

    base["hr_view"]["decision"] = generate_hr_decision(avg_traits)

    return base