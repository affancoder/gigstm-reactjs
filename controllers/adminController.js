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
						{ gigId: { $regex: search, $options: "i" } },
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
				gigId: u.gigId,
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




// Export Users to CSV
exports.exportUsersToCSV = catchAsync(async (req, res, next) => {
	const search = (req.query.search || "").trim();

	const matchStage =
		search.length > 0
			? {
					$or: [
						{ name: { $regex: search, $options: "i" } },
						{ email: { $regex: search, $options: "i" } },
						{ uniqueId: { $regex: search, $options: "i" } },
						{ gigId: { $regex: search, $options: "i" } },
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

	const users = await User.aggregate(pipeline);

	if (!users || users.length === 0) {
		return next(new AppError("No users found to export", 404));
	}

	// Helper to escape CSV fields
	const escapeCsv = (val) => {
		if (val === null || val === undefined) return "";
		const str = String(val);
		// If contains comma, double quote, or newline, wrap in quotes and escape internal quotes
		if (str.includes(",") || str.includes('"') || str.includes("\n")) {
			return `"${str.replace(/"/g, '""')}"`;
		}
		return str;
	};

	// Define headers
	const headers = [
		"User ID", "Unique ID", "GIG ID", "Name", "Email", "Phone Number", "Role", "Status", "Admin Message", "Joined Date",
		"Job Role", "Gender", "DOB", "Aadhaar No", "PAN No",  
		"Address Line 1", "Address Line 2", "City", "State", "Country", "Pincode", "About",
		"Bank Name", "Account Number", "IFSC Code",
		"Occupation", "Experience Years", "Experience Months", "Employment Type", "Job Requirement", "Heard About", "Interest Type",
		"Profile Image URL", "Resume URL", "Aadhaar File URL", "PAN File URL",
		"Aadhaar Front URL", "Aadhaar Back URL", "PAN Card KYC URL", "Passbook URL", "Resume Step 2 URL"
	];

	// Map data to rows
	const rows = users.map(u => {
		const p = u.profile || {};
		const k = u.kyc || {};
		const e = u.experience || {};

		return [
			u._id, u.uniqueId, u.gigId, u.name, u.email, p.mobile, u.role, u.status, u.admin_message, u.createdAt,
			p.jobRole, p.gender, p.dob, p.aadhaar, p.pan,
			p.address1, p.address2, p.city, p.state, p.country, p.pincode, p.about,
			k.bankName, k.accountNumber, k.ifscCode,
			e.occupation, e.experienceYears, e.experienceMonths, e.employmentType, e.jobRequirement, e.heardAbout, e.interestType,
			p.profileImage, p.resumeFile, p.aadhaarFile, p.panFile,
			k.aadhaarFront, k.aadhaarBack, k.panCardUpload, k.passbookUpload, e.resumeStep2
		].map(escapeCsv).join(",");
	});

	const csvContent = headers.join(",") + "\n" + rows.join("\n");

	res.setHeader("Content-Type", "text/csv");
	res.setHeader("Content-Disposition", "attachment; filename=users-export.csv");
	res.status(200).send(csvContent);
});

// Master CSV Export (No filters, GIG ID first)
exports.exportMasterCSV = catchAsync(async (req, res, next) => {
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
		{ $sort: { createdAt: -1 } }
	];

	const users = await User.aggregate(pipeline);

	if (!users || users.length === 0) {
		return next(new AppError("No users found to export", 404));
	}

	// Helper to escape CSV fields
	const escapeCsv = (val) => {
		if (val === null || val === undefined) return "";
		const str = String(val);
		if (str.includes(",") || str.includes('"') || str.includes("\n")) {
			return `"${str.replace(/"/g, '""')}"`;
		}
		return str;
	};

	// Define headers (GIG ID first)
	const headers = [
		"GIG ID", "User ID", "Unique ID", "Name", "Email", "Phone Number", "Role", "Status", "Admin Message", "Joined Date",
		"Job Role", "Gender", "DOB", "Aadhaar No", "PAN No",  
		"Address Line 1", "Address Line 2", "City", "State", "Country", "Pincode", "About",
		"Bank Name", "Account Number", "IFSC Code",
		"Occupation", "Experience Years", "Experience Months", "Employment Type", "Job Requirement", "Heard About", "Interest Type",
		"Profile Image URL", "Resume URL", "Aadhaar File URL", "PAN File URL",
		"Aadhaar Front URL", "Aadhaar Back URL", "PAN Card KYC URL", "Passbook URL", "Resume Step 2 URL"
	];

	// Map data to rows
	const rows = users.map(u => {
		const p = u.profile || {};
		const k = u.kyc || {};
		const e = u.experience || {};

		return [
			u.gigId, u._id, u.uniqueId, u.name, u.email, p.mobile, u.role, u.status, u.admin_message, u.createdAt,
			p.jobRole, p.gender, p.dob, p.aadhaar, p.pan,
			p.address1, p.address2, p.city, p.state, p.country, p.pincode, p.about,
			k.bankName, k.accountNumber, k.ifscCode,
			e.occupation, e.experienceYears, e.experienceMonths, e.employmentType, e.jobRequirement, e.heardAbout, e.interestType,
			p.profileImage, p.resumeFile, p.aadhaarFile, p.panFile,
			k.aadhaarFront, k.aadhaarBack, k.panCardUpload, k.passbookUpload, e.resumeStep2
		].map(escapeCsv).join(",");
	});

	// Combine headers and rows
	const csvContent = [headers.join(","), ...rows].join("\n");

	// Send CSV file
	res.header("Content-Type", "text/csv");
	res.header("Content-Disposition", 'attachment; filename="gigs_master_data.csv"');
	res.status(200).send(csvContent);
});

// Update User Status
exports.updateUserStatus = catchAsync(async (req, res, next) => {
	const { gigId } = req.params;
	const { status, admin_message } = req.body;

	// Validate status
	const validStatuses = ['approved', 'disapproved'];
	if (!status || !validStatuses.includes(status)) {
		return next(new AppError('Invalid status value. Allowed: approved, disapproved', 400));
	}

	// Prepare update payload - ONLY status and admin_message
	const updateData = { status };

	if (status === 'disapproved') {
		// Accept and store admin feedback message
		if (typeof admin_message === 'string' && admin_message.trim().length > 0) {
			updateData.admin_message = admin_message.trim();
		}
	} else if (status === 'approved') {
		// Ensure feedback message is cleared or null
		updateData.admin_message = null;
	}

	// Find by gigId ONLY
	const user = await User.findOneAndUpdate(
		{ gigId: gigId },
		updateData,
		{ new: true, runValidators: true }
	);

	if (!user) {
		return next(new AppError('No user found with that GIG ID', 404));
	}

	res.status(200).json({
		status: 'success',
		data: {
			status: user.status
		}
	});
});
