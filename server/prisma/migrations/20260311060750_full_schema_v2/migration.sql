-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "name" TEXT,
    "avatar" TEXT,
    "walletAddress" TEXT,
    "authProvider" TEXT,
    "authProviderId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "kycStatus" TEXT NOT NULL DEFAULT 'none',
    "creditScore" INTEGER NOT NULL DEFAULT 100,
    "riskAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "category" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issuerLogo" TEXT,
    "coverImage" TEXT,
    "description" TEXT,
    "useOfFunds" TEXT,
    "faceValue" REAL NOT NULL DEFAULT 100,
    "askPrice" REAL NOT NULL DEFAULT 100,
    "apy" REAL NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "creditScore" INTEGER NOT NULL DEFAULT 700,
    "status" TEXT NOT NULL DEFAULT 'Fundraising',
    "targetAmount" REAL NOT NULL,
    "raisedAmount" REAL NOT NULL DEFAULT 0,
    "backersCount" INTEGER NOT NULL DEFAULT 0,
    "remainingCap" REAL NOT NULL DEFAULT 0,
    "coverageRatio" REAL NOT NULL DEFAULT 0,
    "verifiedSource" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MonthlyRevenue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    CONSTRAINT "MonthlyRevenue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "shares" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Investment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradeOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT,
    "listPrice" REAL NOT NULL,
    "originalPrice" REAL NOT NULL,
    "shares" REAL NOT NULL,
    "totalValue" REAL NOT NULL,
    "expectedReturn" REAL NOT NULL,
    "expectedYield" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Listed',
    "listedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soldAt" DATETIME,
    CONSTRAINT "TradeOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TradeOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TreasurySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tvl" REAL NOT NULL,
    "collateralRatio" REAL NOT NULL,
    "treasuryRevenue" REAL NOT NULL,
    "tBillsPercent" REAL NOT NULL,
    "liquidityPercent" REAL NOT NULL,
    "operationsPercent" REAL NOT NULL,
    "lastPoR" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "asset" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "txHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PortfolioHolding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "avgCost" REAL NOT NULL DEFAULT 0,
    "currentApy" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PortfolioHolding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupChat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "fundedAmount" REAL NOT NULL DEFAULT 0,
    "apy" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupChat_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupChat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'investor',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupChat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GroupMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "agentId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnterpriseVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "registrationNo" TEXT,
    "licenseDoc" TEXT,
    "uboName" TEXT,
    "uboIdDoc" TEXT,
    "step" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "creditAwarded" INTEGER NOT NULL DEFAULT 0,
    "sbtMinted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EnterpriseVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProposedApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "monthlyRevenue" REAL NOT NULL,
    "requestedAmount" REAL NOT NULL,
    "proposedApy" REAL NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "collateralType" TEXT,
    "collateralValue" REAL NOT NULL DEFAULT 0,
    "revenueSource" TEXT,
    "revenueVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reviewNotes" TEXT,
    "aiScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProposedApplication_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "EnterpriseVerification" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProposedApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreditScoreHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "tier" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditScoreHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreditScoreEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "refId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditScoreEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RepaymentSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "principalDue" REAL NOT NULL,
    "interestDue" REAL NOT NULL,
    "totalDue" REAL NOT NULL,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RepaymentSchedule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collateral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pledged',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Collateral_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LiquidationEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "collateralId" TEXT,
    "triggerReason" TEXT NOT NULL,
    "recoveredAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "waterfallTier" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LiquidationEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LiquidationEvent_collateralId_fkey" FOREIGN KEY ("collateralId") REFERENCES "Collateral" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GovernanceProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "forVotes" REAL NOT NULL DEFAULT 0,
    "againstVotes" REAL NOT NULL DEFAULT 0,
    "quorum" REAL NOT NULL DEFAULT 0,
    "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" DATETIME NOT NULL,
    "executedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GovernanceProposal_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GovernanceVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GovernanceVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "GovernanceProposal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GovernanceVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_category_idx" ON "Project"("category");

-- CreateIndex
CREATE INDEX "MonthlyRevenue_projectId_idx" ON "MonthlyRevenue"("projectId");

-- CreateIndex
CREATE INDEX "Investment_userId_idx" ON "Investment"("userId");

-- CreateIndex
CREATE INDEX "Investment_projectId_idx" ON "Investment"("projectId");

-- CreateIndex
CREATE INDEX "TradeOrder_projectId_idx" ON "TradeOrder"("projectId");

-- CreateIndex
CREATE INDEX "TradeOrder_sellerId_idx" ON "TradeOrder"("sellerId");

-- CreateIndex
CREATE INDEX "TradeOrder_status_idx" ON "TradeOrder"("status");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "PortfolioHolding_userId_idx" ON "PortfolioHolding"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioHolding_userId_asset_key" ON "PortfolioHolding"("userId", "asset");

-- CreateIndex
CREATE UNIQUE INDEX "GroupChat_projectId_key" ON "GroupChat"("projectId");

-- CreateIndex
CREATE INDEX "GroupMember_groupId_idx" ON "GroupMember"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_userId_key" ON "GroupMember"("groupId", "userId");

-- CreateIndex
CREATE INDEX "GroupMessage_groupId_idx" ON "GroupMessage"("groupId");

-- CreateIndex
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");

-- CreateIndex
CREATE INDEX "ChatMessage_agentId_idx" ON "ChatMessage"("agentId");

-- CreateIndex
CREATE INDEX "EnterpriseVerification_userId_idx" ON "EnterpriseVerification"("userId");

-- CreateIndex
CREATE INDEX "EnterpriseVerification_status_idx" ON "EnterpriseVerification"("status");

-- CreateIndex
CREATE INDEX "ProposedApplication_userId_idx" ON "ProposedApplication"("userId");

-- CreateIndex
CREATE INDEX "ProposedApplication_status_idx" ON "ProposedApplication"("status");

-- CreateIndex
CREATE INDEX "CreditScoreHistory_userId_idx" ON "CreditScoreHistory"("userId");

-- CreateIndex
CREATE INDEX "CreditScoreEvent_userId_idx" ON "CreditScoreEvent"("userId");

-- CreateIndex
CREATE INDEX "CreditScoreEvent_eventType_idx" ON "CreditScoreEvent"("eventType");

-- CreateIndex
CREATE INDEX "RepaymentSchedule_projectId_idx" ON "RepaymentSchedule"("projectId");

-- CreateIndex
CREATE INDEX "RepaymentSchedule_status_idx" ON "RepaymentSchedule"("status");

-- CreateIndex
CREATE INDEX "RepaymentSchedule_dueDate_idx" ON "RepaymentSchedule"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "RepaymentSchedule_projectId_periodNumber_key" ON "RepaymentSchedule"("projectId", "periodNumber");

-- CreateIndex
CREATE INDEX "Collateral_projectId_idx" ON "Collateral"("projectId");

-- CreateIndex
CREATE INDEX "LiquidationEvent_projectId_idx" ON "LiquidationEvent"("projectId");

-- CreateIndex
CREATE INDEX "LiquidationEvent_status_idx" ON "LiquidationEvent"("status");

-- CreateIndex
CREATE INDEX "GovernanceProposal_status_idx" ON "GovernanceProposal"("status");

-- CreateIndex
CREATE INDEX "GovernanceProposal_creatorId_idx" ON "GovernanceProposal"("creatorId");

-- CreateIndex
CREATE INDEX "GovernanceVote_proposalId_idx" ON "GovernanceVote"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceVote_proposalId_userId_key" ON "GovernanceVote"("proposalId", "userId");
