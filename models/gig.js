const mongoose = require("mongoose");

const GigSchema = new mongoose.Schema(
  {
    gigTitle: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    shortDescription: { type: String, required: true, trim: true },
    fullDescription: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    workType: {
      type: String,
      enum: ["Remote", "Field", "Hybrid"],
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["Per Task", "Per Day", "Per Milestone"],
      required: true,
    },
    payout: { type: Number, required: true, min: 0 },
    openings: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["Draft", "Published"], default: "Draft" },
    skills: { type: String, required: true, trim: true },

    // Internal-only fields
    scopeOfWork: { type: String, required: true, trim: true },
    payoutTerms: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gig", GigSchema);
