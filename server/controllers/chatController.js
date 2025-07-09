const Message = require('../models/Message');

// @route POST /api/chat
// @desc  Send a message
// @access Private
exports.sendMessage = async (req, res) => {
  const { receiverId, subject = '', content, jobId } = req.body;
  if (!receiverId || !content) {
    return res.status(400).json({ msg: 'receiverId and content required' });
  }
  try {
    let msg = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      subject,
      content,
      job: jobId || null,
    });

    // populate sender and receiver for immediate client use
    msg = await Message.findById(msg._id).populate('sender', 'name email').populate('receiver', 'name email');

    // Emit via socket.io if possible
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(receiverId).emit('newMessage', msg);
        io.to(req.user.id).emit('newMessage', msg); // sender room too
      }
    } catch (_) {}



    res.status(201).json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route GET /api/chat
// @desc  Get all messages for current user
// @access Private
exports.getMyMessages = async (req, res) => {
  try {
    const msgs = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    }).sort({ createdAt: 1 }).populate('sender', 'name email').populate('receiver', 'name email');
    res.json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
