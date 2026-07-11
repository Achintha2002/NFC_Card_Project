import { Router } from "express";
import multer from "multer";
import { createDesign, getDesign } from "../controllers/designs.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("bgImageFile"), createDesign);
router.get("/:id", getDesign);

export default router;
