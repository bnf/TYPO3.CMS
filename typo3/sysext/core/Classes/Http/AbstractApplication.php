<?php
declare(strict_types = 1);
namespace TYPO3\CMS\Core\Http;

/*
 * This file is part of the TYPO3 CMS project.
 *
 * It is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License, either version 2
 * of the License, or any later version.
 *
 * For the full copyright and license information, please read the
 * LICENSE.txt file that was distributed with this source code.
 *
 * The TYPO3 project - inspiring people to share!
 */

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use TYPO3\CMS\Core\Core\ApplicationInterface;

/**
 * @internal
 */
class AbstractApplication implements ApplicationInterface
{
    /**
     * @var RequestHandlerInterface
     */
    protected $requestHandler;

    /**
     * @var array
     */
    protected $middlewares = [];

    /**
     * Construct Application
     *
     * @param RequestHandlerInterface $requestHandler
     * @param array $middlewares
     */
    public function __construct(RequestHandlerInterface $requestHandler, array $middlewares = [])
    {
        $this->requestHandler = $requestHandler;
        $this->middlewares = $middlewares;
    }

    /**
     * Outputs content
     *
     * @param ResponseInterface $response
     */
    protected function sendResponse(ResponseInterface $response)
    {
        if ($response instanceof \TYPO3\CMS\Core\Http\NullResponse) {
            return;
        }

        if (!headers_sent()) {
            // If the response code was not changed by legacy code (still is 200)
            // then allow the PSR-7 response object to explicitly set it.
            // Otherwise let legacy code take precedence.
            // This code path can be deprecated once we expose the response object to third party code
            if (http_response_code() === 200) {
                header('HTTP/' . $response->getProtocolVersion() . ' ' . $response->getStatusCode() . ' ' . $response->getReasonPhrase());
            }

            foreach ($response->getHeaders() as $name => $values) {
                header($name . ': ' . implode(', ', $values));
            }
        }
        echo $response->getBody()->__toString();
    }

    /**
     * @param ServerRequestInterface $request
     * @return ResponseInterface
     */
    protected function handle(ServerRequestInterface $request): ResponseInterface
    {
        $dispatcher = new MiddlewareDispatcher($this->requestHandler, $this->middlewares, \TYPO3\CMS\Core\Core\Container::getInstance());

        return $dispatcher->handle($request);
    }

    /**
     * Set up the application and shut it down afterwards
     *
     * @param callable $execute
     */
    public function run(callable $execute = null)
    {
        $response = $this->handle(\TYPO3\CMS\Core\Http\ServerRequestFactory::fromGlobals());

        if ($execute !== null) {
            call_user_func($execute);
        }

        $this->sendResponse($response);
    }
}
