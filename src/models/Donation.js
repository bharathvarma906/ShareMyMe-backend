const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor reference is required'],
    },
    foodName: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['RICE', 'CURRY', 'BAKERY', 'PACKAGED', 'FRUITS', 'DAIRY', 'BEVERAGES', 'OTHER'],
      default: 'OTHER',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unit: {
      type: String,
      enum: ['MEALS', 'KG', 'LITERS', 'PACKETS', 'BOXES'],
      default: 'MEALS',
    },
    description: {
      type: String,
      default: '',
    },
    preparationDate: {
      type: Date,
      default: Date.now,
    },
    expiryTime: {
      type: Date,
      required: [true, 'Expiry time is required'],
    },
    pickupAddress: {
      type: String,
      required: [true, 'Pickup address is required'],
    },
    pickupCity: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['CREATED', 'AVAILABLE', 'CLAIMED', 'COLLECTING', 'COLLECTED', 'DISTRIBUTED', 'EXPIRED', 'CANCELLED'],
      default: 'AVAILABLE',
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
donationSchema.index({ status: 1, expiryTime: 1 });
donationSchema.index({ donorId: 1 });
donationSchema.index({ claimedBy: 1 });

module.exports = mongoose.model('Donation', donationSchema);
