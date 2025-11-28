import {
	Action,
	ActionPanel,
	Color,
	Icon,
	List,
	showToast,
	Toast,
} from "@raycast/api";
import { useEffect } from "react";
import { useCachedPromise } from "@raycast/utils";
import { getQuickStatus, type QuickStatus } from "./api";

export default function TodayStatus() {
	const {
		data: status,
		isLoading,
		error,
	} = useCachedPromise(getQuickStatus);

	useEffect(() => {
		if (error) {
			showToast({
				style: Toast.Style.Failure,
				title: "Failed to load status",
				message: error.message,
			});
		}
	}, [error]);

	const completed = status?.boards.filter((b) => b.checkedInToday).length ?? 0;
	const total = status?.boards.length ?? 0;

	return (
		<List isLoading={isLoading}>
			<List.Section title={`Today's Progress: ${completed}/${total}`}>
				{status?.boards.map((board) => (
					<List.Item
						key={board.id}
						icon={{
							source: board.checkedInToday ? Icon.CheckCircle : Icon.Circle,
							tintColor: board.checkedInToday
								? Color.Green
								: Color.SecondaryText,
						}}
						title={`${board.emoji} ${board.name}`}
						subtitle={board.checkedInToday ? "Completed" : "Pending"}
						accessories={[
							{ icon: Icon.Star, text: `${board.currentStreak} days` },
						]}
						actions={
							<ActionPanel>
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
			</List.Section>
		</List>
	);
}
