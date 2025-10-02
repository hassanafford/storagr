<?php
$mysqli = new mysqli("localhost", "root", "", "storage");

if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

// Set charset to UTF-8
$mysqli->set_charset("utf8mb4");

// Insert warehouses first
$warehouses = [
    ['المخزن الرئيسي', 'المخزن الرئيسي للمدرسة'],
    ['مخزن المختبر', 'مخزن معدات المختبر'],
    ['مخزن المكتبة', 'مخزن كتب المكتبة'],
    ['مخزن الملابس', 'مخزن ملابس الطلاب'],
    ['مخزن الأثاث', 'مخزن أثاث المدرسة'],
    ['مخزن الإلكترونيات', 'مخزن الأجهزة الإلكترونية'],
    ['مخزن الأدوات', 'مخزن الأدوات المدرسية'],
    ['مخزن المواد الغذائية', 'مخزن المواد الغذائية للمقهى'],
    ['مخزن التنظيف', 'مخزن مواد التنظيف'],
    ['مخزن الرياضة', 'مخزن معدات الرياضة'],
    ['مخزن الفنون', 'مخزن مستلزمات الفنون'],
    ['مخزن الإسعافات', 'مخزن مستلزمات الإسعافات الأولية']
];

echo "Inserting warehouses...\n";
$stmt = $mysqli->prepare("INSERT INTO warehouses (name, description) VALUES (?, ?)");
foreach ($warehouses as $warehouse) {
    $stmt->bind_param("ss", $warehouse[0], $warehouse[1]);
    $stmt->execute();
}
echo "Warehouses inserted successfully\n";

// Insert categories after warehouses
$categories = [
    ['أدوات مدرسية', 1],
    ['معدات إلكترونية', 1],
    ['أدوات تنظيف', 1],
    ['مستلزمات المكتب', 1],
    ['معدات مختبر كيمياء', 2],
    ['معدات مختبر فيزياء', 2],
    ['معدات مختبر بيولوجيا', 2],
    ['كتب دراسية', 3],
    ['كتب مرجعية', 3],
    ['مجلات', 3],
    ['زي مدرسي', 4],
    ['بدلات رياضة', 4],
    ['مكاتب', 5],
    ['كراسي', 5],
    ['ألواح', 5],
    ['حاسبات', 6],
    ['سماعات', 6],
    ['شاشات', 6],
    ['مساطر', 7],
    ['أقلام', 7],
    ['كراسات', 7],
    ['وجبات خفيفة', 8],
    ['مشروبات', 8],
    ['منظفات', 9],
    ['مناديل', 9],
    ['كرة القدم', 10],
    ['كرة السلة', 10],
    ['دهانات', 11],
    ['فرش', 11],
    ['أدوية', 12],
    ['ضمادات', 12]
];

echo "Inserting categories...\n";
$stmt = $mysqli->prepare("INSERT INTO categories (name, warehouse_id) VALUES (?, ?)");
foreach ($categories as $category) {
    $stmt->bind_param("si", $category[0], $category[1]);
    $stmt->execute();
}
echo "Categories inserted successfully\n";

// Insert items after categories
$items = [
    ['كراسات خط', 1, 1, 100, 'كراسات خط أحمر للطلاب'],
    ['أقلام جاف', 1, 1, 50, 'أقلام جاف أسود'],
    ['مساطر', 1, 1, 75, 'مساطر بلاستيكية'],
    ['حاسبات', 2, 1, 20, 'حاسبات علمية'],
    ['سماعات', 2, 1, 15, 'سماعات لاسلكية'],
    ['مكنسة', 3, 1, 5, 'مكنسة كهربائية'],
    ['مطهر', 3, 1, 30, 'مطهر يدين'],
    ['أقلام رصاص', 1, 1, 40, 'أقلام رصاص HB'],
    ['ممحاة', 1, 1, 60, 'ممحاة بيضاء'],
    ['مجهر', 4, 2, 10, 'مجهر مختبر علمي'],
    ['أنابيب اختبار', 4, 2, 200, 'أنابيب اختبار زجاجية'],
    ['كحول', 6, 2, 50, 'كحول طبي 70%'],
    ['كتاب الرياضيات', 7, 3, 25, 'كتاب الرياضيات للصف الأول'],
    ['كتاب اللغة العربية', 7, 3, 30, 'كتاب اللغة العربية للصف الأول'],
    ['قاموس', 8, 3, 10, 'قاموس إنجليزي-عربي'],
    ['زي مدرسي أولياء', 9, 4, 50, 'زي مدرسي للصف الأول'],
    ['بدلة رياضة', 10, 4, 40, 'بدلة رياضة للطلاب'],
    ['مكتب مدرس', 11, 5, 15, 'مكتب مدرس خشبي'],
    ['كرسي طالب', 12, 5, 100, 'كرسي طالب بلاستيك'],
    ['جهاز عرض', 13, 6, 5, 'جهاز عرض ذكي'],
    ['سماعة ميكروفون', 14, 6, 8, 'سماعة ميكروفون للفصل'],
    ['شاحن هواتف', 15, 7, 30, 'شاحن هواتف USB'],
    ['ملصقات', 15, 7, 100, 'ملصقات ملونة'],
    ['بسكويت', 16, 8, 200, 'بسكويت شاي'],
    ['عصير برتقال', 17, 8, 150, 'عصير برتقال طازج'],
    ['منظف أسطح', 18, 9, 25, 'منظف أسطح متعدد الاستخدامات'],
    ['مناديل مبللة', 19, 9, 50, 'مناديل مبللة لتنظيف الأيدي'],
    ['كرة قدم', 20, 10, 20, 'كرة قدم مطاطية'],
    ['كرة سلة', 21, 10, 15, 'كرة سلة مطاطية'],
    ['دهان أكواريل', 22, 11, 40, 'دهان أكواريل بألوان متعددة'],
    ['فرش رسم', 23, 11, 60, 'فرش رسم بأحجام مختلفة'],
    ['باراسيتامول', 24, 12, 100, 'أقراص باراسيتامول 500 ملغ'],
    ['ضمادة معقمة', 25, 12, 200, 'ضمادة معقمة للجروح']
];

echo "Inserting items...\n";
$stmt = $mysqli->prepare("INSERT INTO items (name, category_id, warehouse_id, quantity, description) VALUES (?, ?, ?, ?, ?)");
foreach ($items as $item) {
    $stmt->bind_param("siiss", $item[0], $item[1], $item[2], $item[3], $item[4]);
    $stmt->execute();
}
echo "Items inserted successfully\n";

// Insert users after warehouses
$users = [
    ['12345678901234', 'مدير النظام', 'admin', null],
    ['11111111111111', 'موظف المخزن الرئيسي', 'employee', 1],
    ['22222222222222', 'موظف مختبر', 'employee', 2],
    ['33333333333333', 'موظف مكتبة', 'employee', 3],
    ['44444444444444', 'موظف ملابس', 'employee', 4],
    ['55555555555555', 'موظف أثاث', 'employee', 5],
    ['66666666666666', 'موظف إلكترونيات', 'employee', 6],
    ['77777777777777', 'موظف أدوات', 'employee', 7],
    ['88888888888888', 'موظف مواد غذائية', 'employee', 8],
    ['99999999999999', 'موظف تنظيف', 'employee', 9],
    ['10101010101010', 'موظف رياضة', 'employee', 10],
    ['11111111111112', 'موظف فنون', 'employee', 11],
    ['12121212121212', 'موظف إسعافات', 'employee', 12]
];

echo "Inserting users...\n";
$stmt = $mysqli->prepare("INSERT INTO users (national_id, name, role, warehouse_id) VALUES (?, ?, ?, ?)");
foreach ($users as $user) {
    $stmt->bind_param("ssss", $user[0], $user[1], $user[2], $user[3]);
    $stmt->execute();
}
echo "Users inserted successfully\n";

// Insert transactions last
$transactions = [
    [1, 2, 'issue', -5, 'طالب 1', 'صرف كراسات للصف الأول'],
    [2, 2, 'issue', -10, 'طالب 2', 'صرف أقلام للصف الثاني'],
    [4, 2, 'issue', -2, 'معلم كيمياء', 'صرف حاسبات للمختبر'],
    [1, 2, 'return', 2, 'حالة جيدة', 'إرجاع كراسات غير مستخدمة']
];

echo "Inserting transactions...\n";
$stmt = $mysqli->prepare("INSERT INTO transactions (item_id, user_id, transaction_type, quantity, recipient, notes) VALUES (?, ?, ?, ?, ?, ?)");
foreach ($transactions as $transaction) {
    $stmt->bind_param("iisiss", $transaction[0], $transaction[1], $transaction[2], $transaction[3], $transaction[4], $transaction[5]);
    $stmt->execute();
}
echo "Transactions inserted successfully\n";

$mysqli->close();
echo "All data inserted successfully with proper Arabic text!\n";
?>