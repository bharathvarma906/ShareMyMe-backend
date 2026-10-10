const mongoose = require('mongoose');

const distributionLogSchema = new mongoose.Schema(
  {
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: [true, 'Donation reference is required'],
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment reference is required'],
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'NGO reference is required'],
    },
    quantityDistributed: {
      type: Number,
      required: [true, 'Distributed quantity is required'],
      min: [1, 'Must distribute at least 1 unit'],
    },
    peopleServed: {
      type: Number,
      required: [true, 'Number of people served is required'],
      min: [1, 'Must serve at least 1 person'],
    },
    distributionDate: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: String,
      required: [true, 'Distribution location is required'],
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

distributionLogSchema.index({ ngoId: 1, createdAt: -1 });
distributionLogSchema.index({ donationId: 1 });

module.exports = mongoose.model('DistributionLog', distributionLogSchema);
