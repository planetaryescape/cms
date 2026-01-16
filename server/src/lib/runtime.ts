import { Layer, ManagedRuntime } from "effect";
import { ContentServiceLive } from "../services/ContentService";
import { DatabaseLive } from "../services/Database";
import { MediaServiceLive } from "../services/MediaService";
import { StatsServiceLive } from "../services/StatsService";
import { TagServiceLive } from "../services/TagService";
import { UserServiceLive } from "../services/UserService";

export const AppLayer = Layer.mergeAll(
	ContentServiceLive,
	UserServiceLive,
	StatsServiceLive,
	TagServiceLive,
	MediaServiceLive,
).pipe(Layer.provide(DatabaseLive));

export const AppRuntime = ManagedRuntime.make(AppLayer);
