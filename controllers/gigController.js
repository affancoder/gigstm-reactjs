const Gig = require("../models/gig");
const GigApplication = require("../models/gigApplication");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createGig = catchAsync(async (req, res, next) => {
  const {
    gigTitle,
    category,
    shortDescription,
    fullDescription,
    location,
    workType,
    paymentType,
    payout,
    openings,
    status,
    skills,
    sop,
    scopeOfWork,
    payoutTerms,
  } = req.body;

  const internalSOP = scopeOfWork ?? sop;
  if (!internalSOP || !payoutTerms) {
    return next(
      new AppError("Scope of Work and Payout Terms are required", 400)
    );
  }

  const gig = await Gig.create({
    gigTitle,
    category,
    shortDescription,
    fullDescription,
    location,
    workType,
    paymentType,
    payout,
    openings,
    status,
    skills,
    scopeOfWork: internalSOP,
    payoutTerms,
  });

  res.status(201).json({
    status: "success",
    data: { gig },
  });
});

exports.updateGig = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const {
    gigTitle,
    category,
    shortDescription,
    fullDescription,
    location,
    workType,
    paymentType,
    payout,
    openings,
    status,
    skills,
    sop,
    scopeOfWork,
    payoutTerms,
  } = req.body;

  const updates = {
    ...(gigTitle !== undefined && { gigTitle }),
    ...(category !== undefined && { category }),
    ...(shortDescription !== undefined && { shortDescription }),
    ...(fullDescription !== undefined && { fullDescription }),
    ...(location !== undefined && { location }),
    ...(workType !== undefined && { workType }),
    ...(paymentType !== undefined && { paymentType }),
    ...(payout !== undefined && { payout }),
    ...(openings !== undefined && { openings }),
    ...(status !== undefined && { status }),
    ...(skills !== undefined && { skills }),
  };

  const resolvedSOP = scopeOfWork ?? sop;
  if (resolvedSOP !== undefined) updates.scopeOfWork = resolvedSOP;
  if (payoutTerms !== undefined) updates.payoutTerms = payoutTerms;

  if (updates.scopeOfWork === undefined || updates.payoutTerms === undefined) {
    const existing = await Gig.findById(id);
    if (!existing) return next(new AppError("Gig not found", 404));
    if (!existing.scopeOfWork && updates.scopeOfWork === undefined)
      return next(new AppError("Scope of Work is required", 400));
    if (!existing.payoutTerms && updates.payoutTerms === undefined)
      return next(new AppError("Payout Terms are required", 400));
  }

  const gig = await Gig.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
  if (!gig) return next(new AppError("Gig not found", 404));

  res.status(200).json({
    status: "success",
    data: { gig },
  });
});

exports.listPublic = catchAsync(async (req, res, next) => {
  const gigs = await Gig.find({ status: "Published" }, "-scopeOfWork -payoutTerms").sort({
    createdAt: -1,
  });
  res.status(200).json({ status: "success", data: { gigs } });
});

exports.getPublic = catchAsync(async (req, res, next) => {
  const gig = await Gig.findById(req.params.id, "-scopeOfWork -payoutTerms");
  if (!gig) return next(new AppError("Gig not found", 404));
  res.status(200).json({ status: "success", data: { gig } });
});

exports.deleteGig = catchAsync(async (req, res, next) => {
  const gig = await Gig.findByIdAndDelete(req.params.id);
  if (!gig) return next(new AppError("Gig not found", 404));
  res.status(204).json({ status: "success", data: null });
});

exports.listAdmin = catchAsync(async (req, res, next) => {
  const gigs = await Gig.find({}).sort({ createdAt: -1 });
  res.status(200).json({ status: "success", data: { gigs } });
});

exports.getAdmin = catchAsync(async (req, res, next) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) return next(new AppError("Gig not found", 404));
  res.status(200).json({ status: "success", data: { gig } });
});

exports.applyGig = catchAsync(async (req, res, next) => {
  const {
    gigId,
    gigTitle,
    fullName,
    phone,
    email,
    location,
    skills,
  } = req.body;

  if (!gigId || !fullName || !phone || !email || !location || !skills) {
    return next(new AppError("All fields are required", 400));
  }

  // Check if gig exists
  const gig = await Gig.findById(gigId);
  if (!gig) {
    return next(new AppError("Gig not found", 404));
  }

  const application = await GigApplication.create({
    gigId,
    gigTitle: gig.gigTitle, // Ensure title matches DB
    applicantName: fullName,
    phone,
    email,
    location,
    skills,
  });

  res.status(201).json({
    status: "success",
    data: { application },
  });
});

exports.getGigApplications = catchAsync(async (req, res, next) => {
  const applications = await GigApplication.find({ gigId: req.params.id }).sort({
    appliedAt: -1,
  });

  res.status(200).json({
    status: "success",
    results: applications.length,
    data: { applications },
  });
});
