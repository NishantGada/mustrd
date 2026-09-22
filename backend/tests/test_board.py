"""The single board and its columns."""


def test_new_user_gets_five_default_columns(user):
    names = [c["name"] for c in user.get("/board").json()["columns"]]
    assert names == ["To Do", "Ready", "In Progress", "Blocked", "Done"]
    kinds = {c["name"]: c["kind"] for c in user.get("/board").json()["columns"]}
    assert kinds["Done"] == "terminal"


def test_old_multi_board_routes_are_gone(user):
    assert user.get("/boards").status_code == 404


def test_add_rename_reorder_columns(user):
    r = user.post("/board/columns", json={"name": "Waiting"})
    assert r.status_code == 201 and r.json()["position"] == 5
    waiting = r.json()["id"]
    assert user.patch(f"/columns/{waiting}", json={"name": "On Hold"}).json()["name"] == "On Hold"

    ids = [c["id"] for c in user.get("/board").json()["columns"]]
    new_order = [ids[-1]] + ids[:-1]
    r = user.put("/board/columns/order", json={"ordered_ids": new_order})
    assert [c["id"] for c in r.json()] == new_order


def test_reorder_must_list_exactly_the_boards_columns(user):
    ids = [c["id"] for c in user.get("/board").json()["columns"]]
    assert user.put("/board/columns/order", json={"ordered_ids": ids[:-1]}).status_code == 400


def test_last_done_column_is_protected(user):
    done = user.columns()["Done"]
    assert user.patch(f"/columns/{done}", json={"kind": "normal"}).status_code == 400
    assert user.delete(f"/columns/{done}").status_code == 400


def test_unmarking_done_is_allowed_when_another_exists_and_reopens_goals(user):
    user.goal("finished", column="Done")
    user.post("/board/columns", json={"name": "Shipped", "kind": "terminal"})
    done = user.columns()["Done"]
    assert user.patch(f"/columns/{done}", json={"kind": "normal"}).status_code == 200
    assert user.goals()["finished"]["completed_at"] is None


def test_deleting_non_empty_column_requires_a_destination(user):
    user.goal("a")
    todo = user.columns()["To Do"]
    assert user.delete(f"/columns/{todo}").status_code == 409
    assert user.delete(f"/columns/{todo}", params={"move_to": todo}).status_code == 400


def test_deleting_column_moves_goals_and_applies_completion(user):
    user.goal("a")
    user.goal("b")
    user.goal("already done", column="Done")
    cols = user.columns()
    assert user.delete(f"/columns/{cols['To Do']}", params={"move_to": cols["Done"]}).status_code == 204

    goals = user.goals()
    assert len(goals) == 3
    assert all(g["column_id"] == cols["Done"] and g["completed_at"] for g in goals.values())
    assert sorted(g["position"] for g in goals.values()) == [0, 1, 2]
    positions = [c["position"] for c in user.get("/board").json()["columns"]]
    assert positions == list(range(len(positions)))


def test_empty_column_deletes_directly(user):
    col = user.post("/board/columns", json={"name": "Temp"}).json()["id"]
    assert user.delete(f"/columns/{col}").status_code == 204
    assert "Temp" not in user.columns()
