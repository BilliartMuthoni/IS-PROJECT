"""Treatment guidance for the disease classes the system supports.

Grounded content only -- the system retrieves and presents this text as written
rather than generating advice. Sources should be verified Kenyan agricultural
references (KALRO, CABI PlantwisePlus, county extension guidance) before this
is used with real farmers; the entries below are placeholders pending that review.
"""

from app.models.diagnosis import CropType

# crop -> disease -> guidance
KNOWLEDGE_BASE = {
    CropType.maize: {
        "Maize Leaf Blight": {
            "summary": "A fungal disease causing long grey-green lesions on the leaves.",
            "treatment": [
                "Remove and destroy badly affected lower leaves.",
                "Apply a registered fungicide containing mancozeb, following the label rate.",
                "Avoid overhead irrigation late in the day.",
            ],
            "prevention": [
                "Rotate away from maize for at least one season.",
                "Plant tolerant varieties where available.",
                "Clear crop residue after harvest.",
            ],
        },
        "Maize Common Rust": {
            "summary": "Small reddish-brown pustules scattered across both leaf surfaces.",
            "treatment": [
                "Apply a registered fungicide at first sign if the crop is still early.",
                "Do not spray within the pre-harvest interval on the label.",
            ],
            "prevention": [
                "Plant early to avoid peak rust pressure.",
                "Use resistant varieties where available.",
            ],
        },
    },
    CropType.tomato: {
        "Tomato Late Blight": {
            "summary": "Dark water-soaked patches that spread quickly in cool, wet weather.",
            "treatment": [
                "Remove and bury affected plants away from the field.",
                "Apply a registered fungicide, repeating as directed on the label.",
                "Avoid working in the crop while foliage is wet.",
            ],
            "prevention": [
                "Improve spacing and drainage to reduce leaf wetness.",
                "Use certified disease-free seed or seedlings.",
                "Do not plant tomatoes after potatoes on the same plot.",
            ],
        },
        "Tomato Early Blight": {
            "summary": "Brown spots with concentric rings, usually starting on older leaves.",
            "treatment": [
                "Remove affected lower leaves and destroy them.",
                "Apply a registered fungicide following label instructions.",
            ],
            "prevention": [
                "Mulch to stop soil splashing onto lower leaves.",
                "Rotate with a non-solanaceous crop.",
            ],
        },
    },
    CropType.potato: {
        "Potato Late Blight": {
            "summary": "Rapidly spreading dark lesions on leaves and stems in wet conditions.",
            "treatment": [
                "Remove and destroy affected haulms.",
                "Apply a registered protectant fungicide before rain where possible.",
                "Harvest only in dry conditions to limit tuber infection.",
            ],
            "prevention": [
                "Plant certified seed potatoes.",
                "Earth up well to protect developing tubers.",
                "Rotate away from potatoes and tomatoes.",
            ],
        },
        "Potato Early Blight": {
            "summary": "Dark spots with concentric rings on older leaves, worse on stressed plants.",
            "treatment": [
                "Remove badly affected foliage.",
                "Apply a registered fungicide as directed.",
            ],
            "prevention": [
                "Keep plants well watered and fed to reduce stress.",
                "Rotate crops between seasons.",
            ],
        },
    },
}


def get_guidance(crop: CropType, disease: str):
    return KNOWLEDGE_BASE.get(crop, {}).get(disease)


def diseases_for_crop(crop: CropType):
    return list(KNOWLEDGE_BASE.get(crop, {}).keys())
