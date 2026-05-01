"""Personalized recommendation engine - REQ-F-12 to REQ-F-15."""

import logging

logger = logging.getLogger(__name__)

# Rule-based recommendation mappings
FACE_SHAPE_STYLES = {
    "oval": {
        "necklines": ["V-neck", "scoop neck", "off-shoulder"],
        "accessories": ["any earring style", "aviator sunglasses"],
        "hairstyles": ["any style works"],
    },
    "round": {
        "necklines": ["V-neck", "deep scoop", "asymmetric"],
        "accessories": ["long drop earrings", "angular frames"],
        "hairstyles": ["layered", "side-parted"],
    },
    "square": {
        "necklines": ["round neck", "scoop neck", "cowl neck"],
        "accessories": ["hoop earrings", "round sunglasses"],
        "hairstyles": ["soft waves", "side-swept bangs"],
    },
    "heart": {
        "necklines": ["V-neck", "sweetheart", "boat neck"],
        "accessories": ["teardrop earrings", "cat-eye frames"],
        "hairstyles": ["chin-length bob", "side bangs"],
    },
    "oblong": {
        "necklines": ["crew neck", "turtleneck", "boat neck"],
        "accessories": ["stud earrings", "wide frames"],
        "hairstyles": ["bangs", "voluminous styles"],
    },
}

SKIN_TONE_COLORS = {
    "Very Light": {"best": ["pastels", "soft pink", "light blue", "lavender"], "avoid": ["neon", "stark white"]},
    "Light": {"best": ["dusty rose", "sage green", "navy", "mauve"], "avoid": ["orange", "gold"]},
    "Light Medium": {"best": ["coral", "teal", "warm red", "olive"], "avoid": ["pale yellow"]},
    "Medium Light": {"best": ["emerald", "royal blue", "berry", "rust"], "avoid": ["khaki"]},
    "Medium": {"best": ["burnt orange", "mustard", "deep teal", "burgundy"], "avoid": ["pale pastels"]},
    "Medium Tan": {"best": ["earth tones", "gold", "orange", "olive green"], "avoid": ["washed-out colors"]},
    "Tan": {"best": ["bright white", "cobalt blue", "fuchsia", "gold"], "avoid": ["brown", "dark navy"]},
    "Dark Tan": {"best": ["bright colors", "jewel tones", "white", "yellow"], "avoid": ["dark brown", "black"]},
    "Dark": {"best": ["bright red", "royal purple", "white", "emerald"], "avoid": ["dark navy", "charcoal"]},
    "Very Dark": {"best": ["bright white", "hot pink", "electric blue", "gold"], "avoid": ["very dark colors"]},
}

BODY_TYPE_OUTFITS = {
    "hourglass": ["fitted dresses", "belted outfits", "wrap dresses", "high-waist pants"],
    "pear": ["A-line skirts", "structured shoulders", "boat neck tops", "wide-leg pants"],
    "apple": ["empire waist dresses", "V-neck tops", "straight-leg pants", "flowy tunics"],
    "rectangle": ["peplum tops", "layered outfits", "belted dresses", "ruffled tops"],
    "inverted_triangle": ["flared skirts", "wide-leg pants", "V-neck tops", "A-line dresses"],
}

OCCASION_FILTERS = {
    "casual": ["jeans", "t-shirts", "sneakers", "sundresses", "shorts"],
    "formal": ["suits", "gowns", "dress shoes", "blazers", "cocktail dresses"],
    "business": ["slacks", "blouses", "loafers", "pencil skirts", "button-downs"],
    "party": ["sequin tops", "statement dresses", "heels", "bold accessories"],
    "sport": ["activewear", "sneakers", "track pants", "sports bras", "moisture-wicking tops"],
}

WEATHER_ADJUSTMENTS = {
    "hot": {"add": ["linen", "cotton", "breathable fabrics", "light layers"], "remove": ["wool", "heavy coats"]},
    "cold": {"add": ["wool", "cashmere", "puffer jackets", "boots", "scarves"], "remove": ["shorts", "sandals"]},
    "moderate": {"add": ["light jackets", "layering pieces"], "remove": []},
    "rainy": {"add": ["waterproof jackets", "boots", "dark colors"], "remove": ["suede", "silk"]},
}

BUDGET_TAGS = {
    "low": "affordable",
    "medium": "mid-range",
    "high": "premium",
}


class RecommendationEngine:
    def __init__(self):
        logger.info("Recommendation engine loaded (rule-based)")

    def recommend(
        self,
        face_shape: str,
        skin_tone: str,
        body_type: str,
        occasion: str = "casual",
        weather: str = "moderate",
        budget: str = "medium",
    ) -> dict:
        """Generate personalized outfit recommendations."""

        face_tips = FACE_SHAPE_STYLES.get(face_shape, FACE_SHAPE_STYLES["oval"])
        color_palette = SKIN_TONE_COLORS.get(skin_tone, SKIN_TONE_COLORS["Medium"])
        outfit_styles = BODY_TYPE_OUTFITS.get(body_type, BODY_TYPE_OUTFITS["rectangle"])
        occasion_items = OCCASION_FILTERS.get(occasion, OCCASION_FILTERS["casual"])
        weather_mods = WEATHER_ADJUSTMENTS.get(weather, WEATHER_ADJUSTMENTS["moderate"])

        return {
            "color_palette": color_palette["best"],
            "colors_to_avoid": color_palette["avoid"],
            "outfit_styles": outfit_styles,
            "neckline_suggestions": face_tips["necklines"],
            "accessory_suggestions": face_tips["accessories"],
            "occasion_items": occasion_items,
            "weather_additions": weather_mods["add"],
            "weather_removals": weather_mods["remove"],
            "budget_tier": BUDGET_TAGS.get(budget, "mid-range"),
        }
