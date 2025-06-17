export enum DownstreamWsMessageAction {
	RequireRefresh,
	NoChangesToReport,
	MessageSent,
	NewMessageToken,
	SuggestRefresh,
	ThreadsAndPossiblyMessages
}
