/*
  Warnings:

  - Added the required column `maxInvestment` to the `investment_plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "investment_plans" ADD COLUMN     "maxInvestment" DECIMAL(10,2) NOT NULL;
