const User = require("../models/user");
const catchAsync = require("../utils/catchAsync");

exports.getCombinedUsers = catchAsync(async (req, res, next) => {
	const page = Math.max(parseInt(req.query.page) || 1, 1);
	const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
	const search = (req.query.search || "").trim();

	const matchStage =
		search.length > 0
			? {
					$or: [
						{ name: { $regex: search, $options: "i" } },
						{ email: { $regex: search, $options: "i" } },
						{ "profile.mobile": { $regex: search, $options: "i" } },
						{ "profile.jobRole": { $regex: search, $options: "i" } },
						{ "experience.occupation": { $regex: search, $options: "i" } },
					],
			  }
			: {};

	const pipeline = [
		{
			$lookup: {
				from: "profiles",
				localField: "_id",
				foreignField: "user",
				as: "profile",
			},
		},
		{
			$lookup: {
				from: "kycs",
				localField: "_id",
				foreignField: "user",
				as: "kyc",
			},
		},
		{
			$lookup: {
				from: "userexperiences",
				localField: "_id",
				foreignField: "user",
				as: "experience",
			},
		},
		{
			$addFields: {
				profile: { $arrayElemAt: ["$profile", 0] },
				kyc: { $arrayElemAt: ["$kyc", 0] },
				experience: { $arrayElemAt: ["$experience", 0] },
			},
		},
	];

	if (Object.keys(matchStage).length > 0) {
		pipeline.push({ $match: matchStage });
	}

	pipeline.push({ $sort: { createdAt: -1 } });
	pipeline.push({
		$facet: {
			data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
			totalCount: [{ $count: "count" }],
		},
	});

	const result = await User.aggregate(pipeline);
	const data = result[0]?.data || [];
	const total = result[0]?.totalCount?.[0]?.count || 0;

	const maskDigits = (val) => {
		if (!val || typeof val !== "string") return val || "";
		const digits = val.replace(/\D/g, "");
		if (digits.length <= 4) return digits;
		const masked = "*".repeat(Math.max(digits.length - 4, 0)) + digits.slice(-4);
		return masked.replace(/(.{4})/g, "$1 ").trim();
	};

	const sanitize = (u) => {
		const kyc = u.kyc || {};
		const profile = u.profile || {};

		return {
			user: {
				id: u._id,
				name: u.name,
				email: u.email,
				role: u.role,
				createdAt: u.createdAt,
			},
			profile: {
				name: profile.name || "",
				email: profile.email || "",
				mobile: profile.mobile || "",
				jobRole: profile.jobRole || "",
				gender: profile.gender || "",
				dob: profile.dob || null,
				aadhaar: profile.aadhaar || "",
				pan: profile.pan || "",
				country: profile.country || "",
				state: profile.state || "",
				city: profile.city || "",
				address1: profile.address1 || "",
				address2: profile.address2 || "",
				pincode: profile.pincode || "",
				about: profile.about || "",
				profileImage: profile.profileImage || "",
				aadhaarFile: profile.aadhaarFile || "",
				panFile: profile.panFile || "",
				resumeFile: profile.resumeFile || "",
				createdAt: profile.createdAt || null,
			},
			kyc: {
				aadhaarFront: kyc.aadhaarFront || "",
				aadhaarBack: kyc.aadhaarBack || "",
				panCardUpload: kyc.panCardUpload || "",
				passbookUpload: kyc.passbookUpload || "",
				createdAt: kyc.createdAt || null,
			},
			experience: {
				occupation: u.experience?.occupation || "",
				experienceYears: u.experience?.experienceYears || "",
				resumeStep2: u.experience?.resumeStep2 || "",
				createdAt: u.experience?.createdAt || null,
			},
		};
	};

	res.status(200).json({
		status: "success",
		page,
		limit,
		total,
		hasNextPage: page * limit < total,
		data: data.map(sanitize),
	});
});
