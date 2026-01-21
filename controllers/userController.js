const User = require("../models/user");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { createSendToken } = require("../utils/jwtUtils");
const Profile = require("../models/profile");
const Experience = require("../models/experience");
const Kyc = require("../models/kyc");
const UserExperience = require("../models/experience");

// Profile
// exports.profile = catchAsync(async (req, res, next) => {
// 	const files = req.files;

// 	await Profile.create({
// 		user: req.user.id,

// 		name: req.body.name,
// 		email: req.body.email,
// 		mobile: req.body.mobile,
// 		jobRole: req.body.jobRole,
// 		gender: req.body.gender,
// 		dob: req.body.dob,

// 		profileImage: files["profile-image"]
// 			? files["profile-image"][0].path
// 			: "",
// 		aadhaarFile: files["aadhaar-file"] ? files["aadhaar-file"][0].path : "",
// 		panFile: files["pan-file"] ? files["pan-file"][0].path : "",
// 		resumeFile: files["resume-file"] ? files["resume-file"][0].path : "",

// 		aadhaar: req.body.aadhaar,
// 		pan: req.body.pan,

// 		country: req.body.country,
// 		state: req.body.state,
// 		city: req.body.city,

// 		address1: req.body.address1,
// 		address2: req.body.address2,
// 		pincode: req.body.pincode,

// 		about: req.body.about,
// 	});

// 	res.status(200).json({ message: "Profile submitted successfully!" });
// });


exports.profile = catchAsync(async (req, res, next) => {
	const files = req.files;

	// Check if profile already exists
	const existingProfile = await Profile.findOne({ user: req.user.id });

	// Prepare profile data
	const profileData = {
		user: req.user.id,

		name: req.body.name,
		email: req.body.email,
		mobile: req.body.mobile,
		jobRole: req.body.jobRole,
		gender: req.body.gender,
		dob: req.body.dob,

		profileImage: files["profile-image"]
			? files["profile-image"][0].path
			: existingProfile?.profileImage || "",

		aadhaarFile: files["aadhaar-file"]
			? files["aadhaar-file"][0].path
			: existingProfile?.aadhaarFile || "",

		panFile: files["pan-file"]
			? files["pan-file"][0].path
			: existingProfile?.panFile || "",

		resumeFile: files["resume-file"]
			? files["resume-file"][0].path
			: existingProfile?.resumeFile || "",

		aadhaar: req.body.aadhaar,
		pan: req.body.pan,

		country: req.body.country,
		state: req.body.state,
		city: req.body.city,

		address1: req.body.address1,
		address2: req.body.address2,
		pincode: req.body.pincode,

		about: req.body.about,
	};

	// If profile exists → UPDATE
	if (existingProfile) {
		await Profile.findOneAndUpdate(
			{ user: req.user.id },
			profileData,
			{ new: true }
		);

		return res
			.status(200)
			.json({ message: "Profile updated successfully!" });
	}

	// If no profile → CREATE new one
	await Profile.create(profileData);

	res.status(200).json({ message: "Profile submitted successfully!" });
});

// Experience
exports.experience = catchAsync(async (req, res, next) => {
	const files = req.files;

	// Check if user already has an Experience entry
	const existingExp = await UserExperience.findOne({ user: req.user.id });

	// Prepare data
	const experienceData = {
		user: req.user.id,

		experienceYears: req.body.experienceYears,
		experienceMonths: req.body.experienceMonths,
		employmentType: req.body.employmentType,

		occupation: req.body.occupation,
		jobRequirement: req.body.jobRequirement,

		heardAbout: req.body.heardAbout,
		interestType: req.body.interestType,

		resumeStep2: files["resumeStep2"] ? files["resumeStep2"][0].path : "",
	};

	// If already exists → UPDATE
	if (existingExp) {
		await UserExperience.findOneAndUpdate(
			{ user: req.user.id },
			experienceData,
			{ new: true }
		);

		return res
			.status(200)
			.json({ message: "Experience updated successfully!" });
	}

	// Else → CREATE
	await UserExperience.create(experienceData);

	res.status(200).json({
		message: "Experience submitted successfully!",
	});
});


// KYC
exports.kyc = catchAsync(async (req, res, next) => {
	const files = req.files;

	// Check if KYC already exists
	const existingKyc = await Kyc.findOne({ user: req.user.id });


	// Prepare data object
	const kycData = {
		user: req.user.id,

		bankName: req.body.bankName,
		accountNumber: req.body.accountNumber,
		ifscCode: req.body.ifscCode,

		aadhaarFront: files["aadhaarFront"]
			? files["aadhaarFront"][0].path
			: existingKyc?.aadhaarFront || "",

		aadhaarBack: files["aadhaarBack"]
			? files["aadhaarBack"][0].path
			: existingKyc?.aadhaarBack || "",

		panCardUpload: files["panCardUpload"]
			? files["panCardUpload"][0].path
			: existingKyc?.panCardUpload || "",

		passbookUpload: files["passbookUpload"]
			? files["passbookUpload"][0].path
			: existingKyc?.passbookUpload || "",
	};

	// If exists → update
	if (existingKyc) {
		await Kyc.findOneAndUpdate(
			{ user: req.user.id },
			kycData,
			{ new: true }
		);

		return res.status(200).json({
			message: "KYC details updated successfully!",
		});
	}

	// Else → create
	await Kyc.create(kycData);

	res.status(200).json({
		message: "KYC details submitted successfully!",
	});
});

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
			experience: {
				experienceYears: u.experience?.experienceYears || "",
				experienceMonths: u.experience?.experienceMonths || "",
				employmentType: u.experience?.employmentType || "",
				occupation: u.experience?.occupation || "",
				jobRequirement: u.experience?.jobRequirement || "",
				heardAbout: u.experience?.heardAbout || "",
				interestType: u.experience?.interestType || "",
				resumeStep2: u.experience?.resumeStep2 || "",
				createdAt: u.experience?.createdAt || null,
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

exports.getProfileCompletion = catchAsync(async (req, res, next) => {
	const userId = req.user.id;
	
	// Get user's profile, experience, and KYC data
	const profile = await Profile.findOne({ user: userId });
	const experience = await UserExperience.findOne({ user: userId });
	const kyc = await Kyc.findOne({ user: userId });
	
	// Define all required fields for 100% completion
	const requiredFields = {
		profile: [
			'name', 'email', 'mobile', 'jobRole', 'gender', 'dob',
			'profileImage', 'aadhaar', 'pan', 'aadhaarFile', 'panFile',
			'country', 'state', 'city', 'address1', 'pincode'
		],
		experience: [
			'experienceYears', 'experienceMonths', 'employmentType',
			'occupation', 'jobRequirement', 'heardAbout', 'interestType'
		],
		kyc: [
			'bankName', 'accountNumber', 'ifscCode',
			'aadhaarFront', 'aadhaarBack', 'panCardUpload', 'passbookUpload'
		]
	};
	
	let totalRequiredFields = 0;
	let completedFields = 0;
	
	// Check profile fields
	totalRequiredFields += requiredFields.profile.length;
	if (profile) {
		requiredFields.profile.forEach(field => {
			if (profile[field] && profile[field] !== '') {
				completedFields++;
			}
		});
	}
	
	// Check experience fields
	totalRequiredFields += requiredFields.experience.length;
	if (experience) {
		requiredFields.experience.forEach(field => {
			if (experience[field] && experience[field] !== '') {
				completedFields++;
			}
		});
	}
	
	// Check KYC fields
	totalRequiredFields += requiredFields.kyc.length;
	if (kyc) {
		requiredFields.kyc.forEach(field => {
			if (kyc[field] && kyc[field] !== '') {
				completedFields++;
			}
		});
	}
	
	const completionPercentage = totalRequiredFields > 0 
		? Math.round((completedFields / totalRequiredFields) * 100)
		: 0;
	
	res.status(200).json({
		status: 'success',
		data: {
			completionPercentage,
			totalRequiredFields,
			completedFields
		}
	});
});

exports.getMyCombined = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.user.id);
	if (!user) {
		return next(new AppError("User not found", 404));
	}
	const profile = await Profile.findOne({ user: req.user.id });
	const kyc = await Kyc.findOne({ user: req.user.id });
	const exp = await UserExperience.findOne({ user: req.user.id });
	const maskDigits = (val) => {
		if (!val || typeof val !== "string") return val || "";
		const digits = val.replace(/\D/g, "");
		if (digits.length <= 4) return digits;
		const masked = "*".repeat(Math.max(digits.length - 4, 0)) + digits.slice(-4);
		return masked.replace(/(.{4})/g, "$1 ").trim();
	};
	res.status(200).json({
		status: "success",
		data: {
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				createdAt: user.createdAt,
			},
			profile: profile
				? {
						name: profile.name || "",
						email: profile.email || "",
						mobile: profile.mobile || "",
						jobRole: profile.jobRole || "",
						gender: profile.gender || "",
						dob: profile.dob || null,
						aadhaar: maskDigits(profile.aadhaar || ""),
						pan: maskDigits(profile.pan || ""),
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
				  }
				: null,
			experience: exp
				? {
						experienceYears: exp.experienceYears || "",
						experienceMonths: exp.experienceMonths || "",
						employmentType: exp.employmentType || "",
						occupation: exp.occupation || "",
						jobRequirement: exp.jobRequirement || "",
						heardAbout: exp.heardAbout || "",
						interestType: exp.interestType || "",
						resumeStep2: exp.resumeStep2 || "",
						createdAt: exp.createdAt || null,
				  }
				: null,
			kyc: kyc
				? {
						bankName: kyc.bankName || "",
						accountNumber: maskDigits(kyc.accountNumber || ""),
						ifscCode: maskDigits(kyc.ifscCode || ""),
						aadhaarFront: kyc.aadhaarFront || "",
						aadhaarBack: kyc.aadhaarBack || "",
						panCardUpload: kyc.panCardUpload || "",
						passbookUpload: kyc.passbookUpload || "",
						createdAt: kyc.createdAt || null,
				  }
				: null,
		},
	});
});
