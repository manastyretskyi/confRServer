const User = require("../database/models/User");
const Topic = require("../database/models/Topic");
const Question = require("../database/models/Question");

module.exports.getQuestionById = async (req, res, next) => {
  const question = await Question.findOne({
    where: { id: req.params.id },
    include: ["Users", User]
  });

  if (!question) return res.status(404).json({ message: "Question not found" });

  res.status(200).json({
    id: question.id,
    question: question.question,
    author: {
      id: question.User.id,
      username: question.User.username
    },
    upvotes: question.Users.map(user => {
      let { id, username } = user;
      return { id, username };
    })
  });
};

module.exports.upvoteQuestion = async (req, res, next) => {
  const question = await Question.findOne({
    where: { id: req.params.id },
    include: ["Users", User]
  });

  if (!question) return res.status(404).json({ message: "Question not found" });

  if (question.Users.find(user => user.id == req.user.id)) {
    question.removeUsers(req.user);
    return res.status(200).json({ message: "Question unvoted" });
  }

  await question.addUsers(req.user);

  res.status(200).json({ message: "Question upvoted" });
};

module.exports.deleteQuestion = async (req, res, next) => {
  const question = await Question.findOne({
    where: { id: req.params.id },
    include: [
      "Users",
      User,
      {
        model: Topic,
        include: [
          { model: User, as: "Users", through: { where: { role: "Creator" } } }
        ]
      }
    ]
  });
  
  if (question.Topic.Users[0].id != req.user.id)
    return res.status(400).json({ message: "You cant edit this topic" });

  if (!question) return res.status(404).json({ message: "Question not found" });

  question.destroy();

  res.status(200).json({ message: "Question successfuly deleted" });
};
