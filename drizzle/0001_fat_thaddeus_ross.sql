CREATE TABLE `analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resumeId` int NOT NULL,
	`userId` int NOT NULL,
	`internScore` int NOT NULL,
	`jobScore` int NOT NULL,
	`matchedKeywordsIntern` text NOT NULL,
	`missingKeywordsIntern` text NOT NULL,
	`matchedKeywordsJob` text NOT NULL,
	`missingKeywordsJob` text NOT NULL,
	`structureValidation` text NOT NULL,
	`recommendations` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resumes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`rawText` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rewriteSuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`originalText` text NOT NULL,
	`suggestedText` text NOT NULL,
	`category` varchar(50) NOT NULL,
	`accepted` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rewriteSuggestions_id` PRIMARY KEY(`id`)
);
