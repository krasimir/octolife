/* eslint-disable camelcase, import/no-dynamic-require  */
const { parse } = require("url");
const { json } = require("micro");
const demo = require("./demo.json");
const { error, success } = require("./utils");

const CACHE_CONTROL = `s-maxage=${60 * 60 * 24 * 90}`;

const cache = {
  // krasimir: demo,
};

module.exports = async (req, res) => {
  const { query } = parse(req.url, true);
  const { user } = query;

  if (req.method === "OPTIONS") {
    return success(res, { hey: "there" }, 201);
  }

  if (!user) {
    return error(res, "Missing `user` GET param.", 400);
  }

  if (req.method === "POST") {
    const data = await json(req);
    cache[user] = data;
    console.log(`Data for "${user}" cached.`);
    return success(res, { thanks: "ok" });
  }

  if (cache[user]) {
    res.setHeader("Cache-Control", CACHE_CONTROL);
    return success(res, {
      data: cache[user],
      cached: Object.keys(cache),
    });
  }
  return success(res, { error: "No data" });
};
