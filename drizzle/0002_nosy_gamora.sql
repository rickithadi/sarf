CREATE TABLE "reports" (
	"break_id" text PRIMARY KEY NOT NULL,
	"rating" integer NOT NULL,
	"headline" text NOT NULL,
	"conditions" text NOT NULL,
	"forecast" text NOT NULL,
	"best_time" text NOT NULL,
	"best_conditions" text NOT NULL,
	"generated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_break_id_breaks_id_fk" FOREIGN KEY ("break_id") REFERENCES "public"."breaks"("id") ON DELETE no action ON UPDATE no action;