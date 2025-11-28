import {
	Action,
	ActionPanel,
	Icon,
	List,
	showToast,
	Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { useCachedPromise } from "@raycast/utils";
import { type Board, getBoards, quickCheckIn } from "./api";

export default function QuickCheckIn() {
	const {
		data: boards,
		isLoading,
		error,
		revalidate,
	} = useCachedPromise(getBoards);

	const [isCheckingIn, setIsCheckingIn] = useState(false);

	useEffect(() => {
		if (error) {
			showToast({
				style: Toast.Style.Failure,
				title: "Failed to load boards",
				message: error.message,
			});
		}
	}, [error]);

	async function handleCheckIn(board: Board) {
		if (isCheckingIn) return;

		setIsCheckingIn(true);
		const toast = await showToast({
			style: Toast.Style.Animated,
			title: "Checking in...",
		});

		try {
			await quickCheckIn(board.id);
			toast.style = Toast.Style.Success;
			toast.title = "Checked in!";
			toast.message = `${board.emoji} ${board.name}`;
			await revalidate();
		} catch (err) {
			toast.style = Toast.Style.Failure;
			toast.title = "Check-in failed";
			toast.message = err instanceof Error ? err.message : "Unknown error";
		} finally {
			setIsCheckingIn(false);
		}
	}

	return (
		<List isLoading={isLoading} searchBarPlaceholder="Search boards...">
			{boards?.map((board) => (
				<List.Item
					key={board.id}
					icon={board.emoji || Icon.Circle}
					title={board.name}
					subtitle={`${board.currentStreak} day streak`}
					accessories={[{ text: `${board.totalCheckIns} check-ins` }]}
					actions={
						<ActionPanel>
							<Action
								title="Check In"
								icon={Icon.Check}
								onAction={() => handleCheckIn(board)}
								shortcut={{ modifiers: ["cmd"], key: "return" }}
							/>
							<Action.CopyToClipboard
								title="Copy Board ID"
								content={board.id}
								shortcut={{ modifiers: ["cmd"], key: "c" }}
							/>
						</ActionPanel>
					}
				/>
			))}
		</List>
	);
}
