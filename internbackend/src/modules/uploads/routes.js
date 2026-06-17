"use strict";

const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { z } = require("zod");

const auth = require("../../middleware/auth");
const rbac = require("../../middleware/rbac");
const config = require("../../config");

const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const ALLOWED_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "..", config.uploadDir || "uploads");

function safeFilename(originalName) {
  const ext = path.extname(originalName || "").toLowerCase();
  return `${uuidv4()}${ALLOWED_EXTS.has(ext) ? ext : ""}`;
}

async function routes(fastify) {
  fastify.post(
    "/",
    {
      preHandler: [auth, rbac("ADMIN", "SENIOR_TL", "TL", "CAPTAIN", "INTERN")],
      schema: { tags: ["Uploads"], description: "Upload an image" },
    },
    async (req, reply) => {
      if (!req.isMultipart()) {
        return reply.status(400).send({ error: "Expected multipart/form-data" });
      }

      const data = await req.file({ limits: { fileSize: config.maxFileSize } });
      if (!data) {
        return reply.status(400).send({ error: "No file in request" });
      }

      const mime = data.mimetype;
      if (!ALLOWED_MIMES.has(mime)) {
        return reply.status(415).send({ error: `Unsupported MIME ${mime}` });
      }

      fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
      const filename = safeFilename(data.filename);
      const dest = path.join(UPLOAD_ROOT, filename);
      await new Promise((resolve, reject) => {
        const out = fs.createWriteStream(dest);
        data.file.pipe(out);
        data.file.on("limit", () => {
          out.destroy();
          fs.unlink(dest, () => {});
          reject(new Error("File too large"));
        });
        out.on("finish", resolve);
        out.on("error", reject);
      });

      const url = `/uploads/${filename}`;
      return reply.send({ url, mime, size: data.file.truncated ? null : data.file.bytesRead });
    },
  );

  fastify.get(
    "/list",
    { preHandler: [auth, rbac("ADMIN", "SENIOR_TL", "TL")] },
    async (_req, reply) => {
      try {
        const files = fs.readdirSync(UPLOAD_ROOT);
        return reply.send({ count: files.length, files: files.slice(0, 200) });
      } catch {
        return reply.send({ count: 0, files: [] });
      }
    },
  );
}

module.exports = routes;