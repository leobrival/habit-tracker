import {
	Action,
	ActionPanel,
	type Color,
	Icon,
	List,
	showToast,
	Toast,
} from "@raycast/api";
import { useEffect } from "react";
import { useCachedPromise } from "@raycast/utils";
import { type Board, getBoards } from "./api";

export default function ListBoards() {
	const {
		data: boards,
		isLoading,
		error,
	} = useCachedPromise(getBoards);

	useEffect(() => {
		if (error) {
			showToast({
				style: Toast.Style.Failure,
				title: "Failed to load boards",
				message: error.message,
			});
		}
	}, [error]);

	return (
		<List isLoading={isLoading} searchBarPlaceholder="Search boards...">
			{boards?.map((board) => (
				<List.Item
					key={board.id}
					icon={{
						source: board.emoji || Icon.Circle,
						tintColor: board.color as Color,
					}}
					title={board.name}
					subtitle={
						board.lastCheckInDate
							? `Last: ${board.lastCheckInDate}`
							: "No check-ins yet"
					}
					accessories={[
						{ icon: Icon.Star, text: `${board.currentStreak}` },
						{ icon: Icon.Trophy, text: `${board.longestStreak}` },
						{ text: `${board.totalCheckIns} total` },
					]}
					actions={
						<ActionPanel>
							<Action.OpenInBrowser
								title="Open in Browser"
								url={`https://checker.app/boards/${board.id}`}
								shortcut={{ modifiers: ["cmd"], key: "o" }}
							/>
							<Action.CopyToClipboard
								title="Copy Board ID"
								content={board.id}
								shortcut={{ modifiers: ["cmd"], key: "c" }}
							/>
							<Action.CopyToClipboard
								title="Copy Board Name"
								content={board.name}
								shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
							/>
						</ActionPanel>
					}
				/>
			))}
		</List>
	);
}
