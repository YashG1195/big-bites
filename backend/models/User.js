import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    addresses: [
      {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        location: {
          type: { type: String, default: 'Point' },
          coordinates: [Number], // [longitude, latitude]
        },
      },
    ],
  },
  { timestamps: true }
);

// Create geospatial index for location
userSchema.index({ 'addresses.location': '2dsphere' });

const User = mongoose.model('User', userSchema);
export default User;
