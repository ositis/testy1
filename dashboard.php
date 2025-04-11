<!DOCTYPE html>
<html lang="en">
<head>
    <title>Hotel Manager Dashboard</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .amenity { margin: 5px; }
        button { margin: 5px; padding: 5px 10px; }
        #editor { display: none; }
    </style>
    <script src="/js/dashboard.js" defer></script>
</head>
<body>
    <h1>Hotel Manager Dashboard</h1>
    <div id="login">
        <input type="text" id="username" placeholder="Username">
        <input type="password" id="password" placeholder="Password">
        <button onclick="login()">Login</button>
    </div>
    <div id="editor">
        <h2 id="hotel-name"></h2>
        <div id="amenities"></div>
        <input type="text" id="new-amenity" placeholder="New Amenity">
        <button onclick="addAmenity()">Add Amenity</button>
        <button onclick="saveChanges()">Save Changes</button>
        <button onclick="logout()">Logout</button>
    </div>
</body>
</html>
