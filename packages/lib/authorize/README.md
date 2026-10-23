Authorizes a principal against alternative required permissions. Each permission
matches service, domain and privilege. At least one alternative must match; the
result contains the satisfied permissions. This is an OR policy, not an
all-permissions requirement. An empty required list denies access. The explicit
string `"none"` bypasses permission lookup and returns an empty permission list.
