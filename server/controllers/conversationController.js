const Message = require('../models/Message');

// @route GET /api/chat/conversations
// @desc  Get latest message for each conversation partner
// @access Private
exports.getConversations = async (req, res) => {
  try {
    const msgs = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name email')
      .populate('receiver', 'name email');

    const map = new Map();

    msgs.forEach(m => {
      const selfId = req.user.id;
      const from = m.sender;
      const to = m.receiver;
      const other = from && from._id?.equals(selfId) ? to : from;

      // If the counterpart user no longer exists (e.g., account deleted), skip this message
      if (!other) return;

      const key = other._id.toString();
      if (!map.has(key)) {
        map.set(key, {
          user: other,
          lastMessage: m.content,
          lastAt: m.createdAt,
        });
      }
    });

    const list = Array.from(map.values()).sort((a, b) => b.lastAt - a.lastAt);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route GET /api/chat/with/:id
// @desc  Get all messages with specified user
// @access Private
exports.getMessagesWith = async (req, res) => {
  const otherId = req.params.id;
  try {
    const msgs = await Message.find({
      $or: [
        { sender: req.user.id, receiver: otherId },
        { sender: otherId, receiver: req.user.id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email')
      .populate('receiver', 'name email');
    res.json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
