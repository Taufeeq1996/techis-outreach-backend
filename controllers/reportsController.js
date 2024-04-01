const EmailBatch = require("../models/emailModel");
const asyncHandler = require("express-async-handler");
const kixieBatch = require("../models/kixieModel");

const getEmailData = asyncHandler(async (req, res) => {
  try {
    const slot = req.query.slot || "month";
    console.log(slot);

    const responseData = {
      emailSent: slot === "month" ? Array(12).fill(0) : Array(7).fill(0),
      emailOpened: slot === "month" ? Array(12).fill(0) : Array(7).fill(0),
    };

    const groupBy =
      slot === "month"
        ? { year: { $year: "$timestamp" }, month: { $month: "$timestamp" } }
        : {
            year: { $year: "$timestamp" },
            week: { $isoDayOfWeek: "$timestamp" },
          };

    const sortCriteria =
      slot === "month"
        ? { "_id.year": 1, "_id.month": 1 }
        : { "_id.year": 1, "_id.week": 1 };

    const aggregatedData = await EmailBatch.aggregate([
      {
        $group: {
          _id: groupBy,
          totalEmailsSent: { $sum: "$emailCount" },
          totalEmailsOpened: { $sum: { $size: "$openedEmail" } },
        },
      },
      {
        $sort: sortCriteria,
      },
    ]);

    aggregatedData.forEach((data) => {
      const index = slot === "month" ? data._id.month - 1 : data._id.week - 1;
      responseData.emailSent[index] = data.totalEmailsSent;
      responseData.emailOpened[index] = data.totalEmailsOpened;
    });

    // New aggregation pipeline for total emails sent and opened till date
    const totalAggregatedData = await EmailBatch.aggregate([
      {
        $group: {
          _id: null,
          totalEmailsSentAllTime: { $sum: "$emailCount" },
          totalEmailsOpenedAllTime: { $sum: { $size: "$openedEmail" } },
        },
      },
    ]);

    // Adding the total counts to responseData
    if (totalAggregatedData[0]) {
      responseData.totalEmailsSentAllTime =
        totalAggregatedData[0].totalEmailsSentAllTime;
      responseData.totalEmailsOpenedAllTime =
        totalAggregatedData[0].totalEmailsOpenedAllTime;
    } else {
      responseData.totalEmailsSentAllTime = 0;
      responseData.totalEmailsOpenedAllTime = 0;
    }

    res.status(200).json(responseData);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching email data", error: error.message });
  }
});

const getSMSData = asyncHandler(async (req, res) => {
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let today = new Date();
  let weekData = new Array(7).fill(0);

  // Determine the start of the 7-day period
  let startOfPeriod = new Date(today);
  startOfPeriod.setDate(today.getDate() - 6);
  startOfPeriod.setHours(0, 0, 0, 0);

  // Aggregate data for the entire 7-day period
  let aggregatedData = await kixieBatch.aggregate([
      {
          $match: {
              timestamp: {
                  $gte: startOfPeriod,
                  $lte: today,
              },
          },
      },
      {
          $group: {
              _id: {
                  dayOfWeek: { $dayOfWeek: "$timestamp" },
              },
              totalSMS: { $sum: "$smsCount" },
          },
      },
  ]);

  // Map the aggregated data to the weekData array
  for (let data of aggregatedData) {
      const index = (data._id.dayOfWeek + 5) % 7; // MongoDB's dayOfWeek is 1-indexed starting from Sunday
      weekData[index] = data.totalSMS;
  }

  // Aggregate total SMS sent all time
  const totalAggregatedData = await kixieBatch.aggregate([
      {
          $group: {
              _id: null,
              totalSMSSentAllTime: { $sum: "$smsCount" },
          },
      },
  ]);

  res.json({
      weekData,
      totalSMSSentAllTime: totalAggregatedData[0].totalSMSSentAllTime
  });
});


module.exports = { getEmailData, getSMSData };
