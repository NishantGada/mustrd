"""Goals: ticket keys, updates, moves."""


def test_goal_without_project_is_keyed_tbd(user):
    g = user.goal("a")
    assert g["key"] == "TBD-1" and g["project_id"] is None


def test_each_project_has_its_own_counter(user):
    work = user.project("Work", "WORK")
    home = user.project("Home", "HOME")
    keys = [user.goal(project_id=work["id"])["key"], user.goal(project_id=work["id"])["key"]]
    assert keys == ["WORK-1", "WORK-2"]
    assert user.goal(project_id=home["id"])["key"] == "HOME-1"


def test_changing_project_takes_next_number_and_numbers_are_never_reused(user):
    work = user.project("Work", "WORK")
    g = user.goal("a")
    assert user.patch(f"/goals/{g['id']}", json={"project_id": work["id"]}).json()["key"] == "WORK-1"
    assert user.patch(f"/goals/{g['id']}", json={"project_id": None}).json()["key"] == "TBD-2"


def test_update_without_project_id_keeps_key(user):
    g = user.goal("a")
    r = user.patch(f"/goals/{g['id']}", json={"title": "renamed"})
    assert r.json()["key"] == "TBD-1" and r.json()["title"] == "renamed"


def test_description_and_due_date_can_be_cleared(user):
    g = user.goal("a", description="details", due_date="2026-10-01T00:00:00Z")
    r = user.patch(f"/goals/{g['id']}", json={"description": None, "due_date": None})
    assert r.status_code == 200
    assert r.json()["description"] is None and r.json()["due_date"] is None
    # And it stuck.
    assert user.goals()["a"]["description"] is None
    assert user.goals()["a"]["due_date"] is None


def test_omitted_fields_are_left_alone(user):
    g = user.goal("a", description="details", due_date="2026-10-01T00:00:00Z")
    r = user.patch(f"/goals/{g['id']}", json={"score": 5})
    assert r.json()["description"] == "details"
    assert r.json()["due_date"].startswith("2026-10-01")


def test_moving_into_done_completes_and_back_out_reopens(user):
    g = user.goal("a")
    cols = user.columns()
    r = user.post(f"/goals/{g['id']}/move", json={"target_column_id": cols["Done"], "position": 0})
    assert r.json()["completed_at"] is not None
    r = user.post(f"/goals/{g['id']}/move", json={"target_column_id": cols["Ready"], "position": 0})
    assert r.json()["completed_at"] is None


def test_move_reorders_within_column(user):
    a, b, c = user.goal("a"), user.goal("b"), user.goal("c")
    todo = user.columns()["To Do"]
    user.post(f"/goals/{c['id']}/move", json={"target_column_id": todo, "position": 0})
    order = sorted(user.goals().values(), key=lambda g: g["position"])
    assert [g["title"] for g in order] == ["c", "a", "b"]


def test_goal_in_unknown_project_is_rejected(user):
    import uuid

    body = {"column_id": user.columns()["To Do"], "title": "x", "score": 1, "project_id": str(uuid.uuid4())}
    assert user.post("/goals", json=body).status_code == 404
