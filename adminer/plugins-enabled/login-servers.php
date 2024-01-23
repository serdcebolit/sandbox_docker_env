<?php
require_once('plugins/login-servers.php');

$auth = [
	'Username' => getenv('PORTAINER_LOGIN'),
	'Password' => getenv('PORTAINER_PASSWORD')
];
$containerFilter = [
	"name" => ['_mysql']
];
$endpointFilter = [
	"name" => ['local']
];
$jwt = '';
$servers = [];

function sendCurlRequest(string $url, array $options)
{
	$ch = curl_init($url);
	foreach ($options as $constant => $option)
	{
		curl_setopt($ch, $constant, $option);
	}

	$result = curl_exec($ch);
	curl_close($ch);

	return $result;
}

try {
	$authRequest = json_decode(
		sendCurlRequest(
			'portainer/api/auth',
			[
				CURLOPT_POST => true,
				CURLOPT_POSTFIELDS => json_encode($auth),
				CURLOPT_FOLLOWLOCATION => true,
				CURLOPT_RETURNTRANSFER => true,
				CURLOPT_HTTPHEADER => ['Content-Type:application/json'],
				CURLOPT_PORT => 9000,
				CURLOPT_SSL_VERIFYHOST => false,
				CURLOPT_SSL_VERIFYPEER => false
			]
		),
		true
	);

	if (isset($authRequest['jwt']))
	{
		$jwt = $authRequest['jwt'];
	}

	if (mb_strlen($jwt))
	{
		$endpointsRequest = json_decode(
			sendCurlRequest(
				"portainer/api/endpoints?filters=" . urlencode(json_encode($endpointFilter)),
				[
					CURLOPT_FOLLOWLOCATION => true,
					CURLOPT_RETURNTRANSFER => true,
					CURLOPT_HTTPHEADER => ["Authorization: Bearer ${jwt}"],
					CURLOPT_PORT => 9000,
					CURLOPT_SSL_VERIFYHOST => false,
					CURLOPT_SSL_VERIFYPEER => false
				]
			),
			true
		);

		$endpointId = array_shift($endpointsRequest)['Id'] ?? 2;

		$containersRequest = json_decode(
			sendCurlRequest(
				"portainer/api/endpoints/${endpointId}/docker/containers/json?filters=" . urlencode(json_encode($containerFilter)),
				[
					CURLOPT_FOLLOWLOCATION => true,
					CURLOPT_RETURNTRANSFER => true,
					CURLOPT_HTTPHEADER => ["Authorization: Bearer ${jwt}"],
					CURLOPT_PORT => 9000,
					CURLOPT_SSL_VERIFYHOST => false,
					CURLOPT_SSL_VERIFYPEER => false
				]
			),
			true
		);

		if ($containersRequest)
		{
			foreach ($containersRequest as $container)
			{
				$name = trim(array_shift($container['Names']), '/');

				$servers[$name] = [
					'server' => $name,
					'driver' => 'server',
					'name' => (explode('_mysql', $name)[0]) ?? ''
				];
			}
			uasort($servers, static function ($a, $b) {
				return $a['server'] <=> $b['server'];
			});
		}
	}
} catch (Throwable $e) {
	die('Не удалось получить список песочниц: '.$e->getMessage().'<br>'.$e->getTraceAsString());
}


return new AdminerLoginServers($servers);