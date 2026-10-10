const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: [true, 'Donation reference is required'],
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor reference is required'],
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'NGO reference is required'],
    },
    status: {
      type: String,
      enum: ['CLAIMED', 'COLLECTING', 'COLLECTED', 'DISTRIBUTED', 'CANCELLED'],
      default: 'CLAIMED',
    },
    claimedAt: {
      type: Date,
      default: Date.now,
    },
    collectedAt: {
      type: Date,
      default: null,
    },
    distributedAt: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ ngoId: 1, status: 1 });
assignmentSchema.index({ donationId: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
