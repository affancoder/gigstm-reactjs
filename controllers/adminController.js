const User = require("../models/user");
const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

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
						{ uniqueId: { $regex: search, $options: "i" } },
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
				uniqueId: u.uniqueId,
				name: u.name,
				email: u.email,
				role: u.role,
				status: u.status,
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
				bankName: kyc.bankName || "",
				accountNumber: kyc.accountNumber || "",
				ifscCode: kyc.ifscCode || "",
				aadhaarFront: kyc.aadhaarFront || "",
				aadhaarBack: kyc.aadhaarBack || "",
				panCardUpload: kyc.panCardUpload || "",
				passbookUpload: kyc.passbookUpload || "",
				createdAt: kyc.createdAt || null,
			},
			experience: {
				occupation: u.experience?.occupation || "",
				experienceYears: u.experience?.experienceYears || "",
				experienceMonths: u.experience?.experienceMonths || "",
				employmentType: u.experience?.employmentType || "",
				jobRequirement: u.experience?.jobRequirement || "",
				heardAbout: u.experience?.heardAbout || "",
				interestType: u.experience?.interestType || "",
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

// Approve or Update User
exports.updateUser = catchAsync(async (req, res, next) => {
	const { uniqueId } = req.params;
	
	// Filter out fields that shouldn't be updated by admin (like password)
	// For now, allow updating role, name, email, etc.
	const allowedUpdates = ['name', 'email', 'role', 'emailVerified'];
	const updates = {};
	Object.keys(req.body).forEach(key => {
		if (allowedUpdates.includes(key)) {
			updates[key] = req.body[key];
		}
	});

	const user = await User.findOneAndUpdate(
		{ uniqueId: uniqueId },
		updates,
		{ new: true, runValidators: true }
	);

	if (!user) {
		return next(new AppError('No user found with that unique ID', 404));
	}

	res.status(200).json({
		status: 'success',
		data: {
			user
		}
	});
});

// Delete User
exports.deleteUser = catchAsync(async (req, res, next) => {
	const { uniqueId } = req.params;
	
	const user = await User.findOneAndDelete({ uniqueId: uniqueId });

	if (!user) {
		return next(new AppError('No user found with that unique ID', 404));
	}

	res.status(204).json({
		status: 'success',
		data: null
	});
});

// Update User Status
exports.updateUserStatus = catchAsync(async (req, res, next) => {
	const { uniqueId } = req.params;
	const { status } = req.body;

	// Validate status
	const validStatuses = ['approved', 'disapproved'];
	if (!status || !validStatuses.includes(status)) {
		return next(new AppError('Invalid status value. Allowed: approved, disapproved', 400));
	}

	let query = { uniqueId: uniqueId };
	if (mongoose.Types.ObjectId.isValid(uniqueId)) {
		// If it's a valid ObjectId, try finding by _id if uniqueId lookup fails, 
		// OR just search by _id.
		// Since uniqueId format (GIG...) is not a valid ObjectId (hex), 
		// if it IS a valid ObjectId, it's likely meant to be an _id.
		query = { _id: uniqueId };
	}

	const user = await User.findOneAndUpdate(
		query,
		{ status: status },
		{ new: true, runValidators: true }
	);

	if (!user) {
		// Fallback: if we searched by _id and failed, maybe it WAS a uniqueId that happened to be hex? (Unlikely for GIG prefix)
		// Or if we searched by uniqueId and failed.
		return next(new AppError('No user found with that ID', 404));
	}

	res.status(200).json({
		status: 'success',
		data: {
			status: user.status
		}
	});
});
