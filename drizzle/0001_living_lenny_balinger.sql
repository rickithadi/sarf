ALTER TABLE "breaks" ADD COLUMN "break_type" text;--> statement-breakpoint
ALTER TABLE "breaks" ADD COLUMN "wave_amplification" double precision;--> statement-breakpoint
ALTER TABLE "breaks" ADD COLUMN "bathymetry" json;