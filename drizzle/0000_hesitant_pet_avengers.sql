CREATE TABLE "breaks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"region" text NOT NULL,
	"bom_station_id" text NOT NULL,
	"optimal_wind_direction" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "observations" (
	"time" timestamp with time zone NOT NULL,
	"break_id" text NOT NULL,
	"air_temp" double precision,
	"wind_speed_kmh" double precision,
	"gust_kmh" double precision,
	"wind_dir" integer,
	"pressure" double precision,
	"humidity" double precision,
	CONSTRAINT "observations_time_break_id_pk" PRIMARY KEY("time","break_id")
);
--> statement-breakpoint
CREATE TABLE "weather_forecasts" (
	"time" timestamp with time zone NOT NULL,
	"break_id" text NOT NULL,
	"wind_speed_10m" double precision,
	"wind_gusts_10m" double precision,
	"wind_direction_10m" integer,
	"precipitation" double precision,
	CONSTRAINT "weather_forecasts_time_break_id_pk" PRIMARY KEY("time","break_id")
);
--> statement-breakpoint
CREATE TABLE "waves" (
	"time" timestamp with time zone NOT NULL,
	"break_id" text NOT NULL,
	"wave_height" double precision,
	"wave_period" double precision,
	"wave_direction" integer,
	"swell_wave_height" double precision,
	"swell_wave_period" double precision,
	"swell_wave_direction" integer,
	CONSTRAINT "waves_time_break_id_pk" PRIMARY KEY("time","break_id")
);
--> statement-breakpoint
CREATE TABLE "tides" (
	"id" serial PRIMARY KEY NOT NULL,
	"time" timestamp with time zone NOT NULL,
	"break_id" text NOT NULL,
	"type" text NOT NULL,
	"height" double precision NOT NULL
);
--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_break_id_breaks_id_fk" FOREIGN KEY ("break_id") REFERENCES "public"."breaks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weather_forecasts" ADD CONSTRAINT "weather_forecasts_break_id_breaks_id_fk" FOREIGN KEY ("break_id") REFERENCES "public"."breaks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waves" ADD CONSTRAINT "waves_break_id_breaks_id_fk" FOREIGN KEY ("break_id") REFERENCES "public"."breaks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tides" ADD CONSTRAINT "tides_break_id_breaks_id_fk" FOREIGN KEY ("break_id") REFERENCES "public"."breaks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "observations_break_id_time_idx" ON "observations" USING btree ("break_id","time");--> statement-breakpoint
CREATE INDEX "weather_forecasts_break_id_time_idx" ON "weather_forecasts" USING btree ("break_id","time");--> statement-breakpoint
CREATE INDEX "waves_break_id_time_idx" ON "waves" USING btree ("break_id","time");--> statement-breakpoint
CREATE INDEX "tides_break_id_time_idx" ON "tides" USING btree ("break_id","time");