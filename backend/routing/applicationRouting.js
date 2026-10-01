const express = require("express");
const { auth } = require("../middleware/auth");
const {
  create,
  get,
  getById,
  update,
  changeStatus,
  remove,
  getStatistics,
  addNote,
  deleteNote,
  addInterview,
  updateInterview,
  deleteInterview,
} = require("../controlling/applicationController");

const router = express.Router();

router.get("/statistics", auth, getStatistics);
router.get("/", auth, get);
router.post("/", auth, create);
router.get("/:id", auth, getById);
router.patch("/:id", auth, update);
router.patch("/:id/status", auth, changeStatus);
router.delete("/:id", auth, remove);

router.post("/:id/notes", auth, addNote);
router.delete("/:id/notes/:noteId", auth, deleteNote);

router.post("/:id/interviews", auth, addInterview);
router.patch("/:id/interviews/:interviewId", auth, updateInterview);
router.delete("/:id/interviews/:interviewId", auth, deleteInterview);

module.exports = { Router: router };
