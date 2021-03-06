const jwt = require("jsonwebtoken");
const mailgun = require("mailgun-js")({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});
const randomstring = require("randomstring");

const User = require("../database/models/User");

const signToken = async user => {
  const token = await jwt.sign(
    {
      username: user.username,
      id: user.id
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1y"
    }
  );

  return token;
};

module.exports.signup = async (req, res, next) => {
  const emailMatches = await User.findOne({
    where: { email: req.body.email }
  });

  if (emailMatches)
    return res.status(400).json({ message: "Email already in use" });

  const usernameMatches = await User.findOne({
    where: { username: req.body.username }
  });

  if (usernameMatches)
    return res.status(400).json({ message: "Username already in use" });

  const user = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    isActive: true,
    verificationCode: randomstring.generate(6)
  });

  // const data = {
  //   from: "verify@confR.com",
  //   to: `${user.email}`,
  //   subject: "Email verification",
  //   text: "Verify your email",
  //   html: `<h2><b>Verification code ${user.verificationCode}</a></h2>`
  // };
  // mailgun.messages().send(data, (error, body) => {
  //   if (error) console.error(error);
  // });
  const token = await signToken(user);

  res.status(201).json({ token: token });
};

module.exports.signin = async (req, res, next) => {
  const token = await signToken(req.user);
  return res.status(200).json({ token: token });
};

module.exports.google = async (req, res, next) => {
  const token = await signToken(req.user);
  return res.status(200).json({ token: token });
};

module.exports.facebook = async (req, res, next) => {
  const token = await signToken(req.user);
  return res.status(200).json({ token: token });
};

module.exports.telegram = async (req, res, next) => {
  const telegramUser = await jwt.verify(
    req.header("Authorization").split(" ")[1],
    process.env.JWT_SECRET
  );

  const match = await User.findOne({
    where: { telegram: String(telegramUser.id) }
  });

  if (!match) {
    const user = await User.create({
      username: telegramUser.username,
      telegram: telegramUser.id,
      isActive: true
    });

    res.status(201).end();
  } else res.status(200).end();
};

module.exports.verify = async (req, res, next) => {
  const user = await User.findOne({
    where: { verificationCode: req.body.verificationCode }
  });

  if (!user)
    return res.status(400).json({ message: "Invalid verification code" });

  user.setDataValue("isActive", true);
  user.setDataValue("verificationCode", null);
  await user.save();

  const token = await signToken(user);

  res.status(200).json({ token: token });
};
