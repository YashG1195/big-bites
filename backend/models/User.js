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
        label: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Other' },
        formattedAddress: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        placeId: String,
        flatNo: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
    favouriteRestaurants: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }
    ],
    favouriteDishes: [
      {
        restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
        menuItemId: { type: mongoose.Schema.Types.ObjectId }
      }
    ],
  },
  { timestamps: true }
);

// (Geospatial index removed as we are using flat lat/lng)

const User = mongoose.model('User', userSchema);
export default User;
