"""Private goals and cross-user isolation."""


def test_locked_goal_masks_project_and_key(user):
    home = user.project("Home", "HOME")
    assert user.put("/security/passcode", json={"passcode": "4321"}).status_code in (200, 204)
    g = user.goal("secret", project_id=home["id"], is_secured=True)
    assert g["key"] == "HOME-1"  # creator sees it

    listed = user.goals()["🔒 Private goal"]
    assert listed["is_locked"]
    assert (listed["project_id"], listed["key"], listed["number"]) == (None, None, None)

    token = user.post("/security/unlock", json={"passcode": "4321"}).json()["unlock_token"]
    revealed = user.get(f"/goals/{g['id']}", headers={"X-Unlock-Token": token}).json()
    assert revealed["key"] == "HOME-1" and revealed["project_id"] == home["id"]
    assert user.patch(f"/goals/{g['id']}", json={"project_id": None}).status_code == 403


def test_users_cannot_touch_each_others_projects(make_user):
    alice, bob = make_user(), make_user()
    work = alice.project("Work", "WORK")
    assert bob.get(f"/projects/{work['id']}").status_code == 404
    body = {"column_id": bob.columns()["To Do"], "title": "x", "score": 1, "project_id": work["id"]}
    assert bob.post("/goals", json=body).status_code == 404
    r = bob.post("/projects", json={"name": "Mine", "key": "MINE", "color": "#000000", "parent_id": work["id"]})
    assert r.status_code == 404
    # Key spaces are per user.
    assert bob.project("Work", "WORK")["key"] == "WORK"
    assert bob.goal()["key"] == "TBD-1"


def test_users_cannot_touch_each_others_goals_or_columns(make_user):
    alice, bob = make_user(), make_user()
    g = alice.goal("mine")
    assert bob.get(f"/goals/{g['id']}").status_code == 404
    assert bob.patch(f"/goals/{g['id']}", json={"title": "hacked"}).status_code == 404
    assert bob.delete(f"/columns/{alice.columns()['Ready']}").status_code == 404
