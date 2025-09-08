import multer from "multer";

// Memory storage: keep files in memory as Buffer for immediate streaming to
// third-party services (Cloudinary). Limits and fileFilter protect against
// oversized or unexpected file types.
const storage = multer.memoryStorage();

const MAX_BYTES = 1 * 1024 * 1024; // 1 MB
const allowedMime = ["image/png", "image/jpeg", "image/jpg"];

export const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (allowedMime.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type"));
  },
});

export default upload;
