import mongoose from 'mongoose';

export const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  isVeg: {
    type: Boolean,
    default: true,
  },
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export default MenuItem;
