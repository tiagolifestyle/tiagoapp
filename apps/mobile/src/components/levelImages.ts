import type { ImageSourcePropType } from "react-native";
import type { LevelKey } from "@tiagolifestyle/shared";
import bronze from "../../assets/levels/bronze.png";
import silver from "../../assets/levels/silver.png";
import gold from "../../assets/levels/gold.png";
import platinum from "../../assets/levels/platinum.png";
import diamond from "../../assets/levels/diamond.png";

export const LEVEL_IMAGES: Record<LevelKey, ImageSourcePropType> = { bronze, silver, gold, platinum, diamond };
