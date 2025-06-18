export enum DownstreamAnySyncMessageAction {
	LocalDatabaseError,
	InitialData,
	ReloadImmediately,
	NewLeaderSoPleaseSprayQueuedMessages,
	NetworkIssueBootedSyncLayer,
	ThreadsMutation
}
