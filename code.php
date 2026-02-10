<?php
if (isset($_GET['ns_dig']) && !empty($_GET['ns_dig'])) {
    $ns_dig = explode(',', $_GET['ns_dig']);
} else {
    $ns_dig = ['8.8.8.8', '8.8.4.4'];
}

$domains = ['domain' => 'example.com'];

$first = `dig @$ns_dig[0] -t ns $domains[domain]`;
echo "<pre>$first</pre>";

$second = `dig @$ns_dig[1] -t ns $domains[domain]`;
echo "<pre>$second</pre>";
