<?php
declare(strict_types = 1);
namespace TYPO3\CMS\Core\DependencyInjection;

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

use Psr\Container\ContainerInterface;

/**
 * @internal
 */
class FailsafeContainer implements ContainerInterface
{
    /**
     * @var array
     */
    private $entries = [];

    /**
     * @var array
     */
    private $factories = [];

    /**
     * Instantiate the container.
     *
     * Objects and parameters can be passed as argument to the constructor.
     *
     * @param array $providers The service providers to register.
     * @param array $entries The default parameters or objects.
     */
    public function __construct(array $providers = [], array $entries = [])
    {
        $this->entries = $entries;

        foreach ($providers as $provider) {
            $this->factories = $provider->getFactories() + $this->factories;
        }

        foreach ($providers as $provider) {
            $extensions = $provider->getExtensions();
            foreach ($extensions as $id => $extension) {
                if (isset($this->factories[$id])) {
                    $innerFactory = $this->factories[$id];
                    $this->factories[$id] = function (ContainerInterface $container) use ($extension, $innerFactory) {
                        $previous = ($innerFactory)($container);
                        return ($extension)($container, $previous);
                    };
                } else {
                    // calling extension as a regular factory means the second parameter is null
                    // If the extension declares a non-nullable type for the second parameter the
                    // call will fail – by intent.
                    $this->factories[$id] = $extension;
                }
            }
        }
    }

    /**
     * @param string $id
     * @return bool
     */
    public function has($id)
    {
        return array_key_exists($id, $this->entries) || array_key_exists($id, $this->factories);
    }

    /**
     * @param string $id
     * @return mixed
     */
    private function create(string $id)
    {
        $factory = $this->factories[$id] ?? null;

        if ((bool)$factory) {
            // Remove factory as it is no longer required.
            // Set factory to false to be able to detect
            // cyclic dependency loops.
            $this->factories[$id] = false;

            return $this->entries[$id] = ($factory)($this);
        }
        if (array_key_exists($id, $this->entries)) {
            // This condition is triggered in the unlikely case that the entry is null
            // Note: That is because the coalesce operator used in get() can not handle that
            return $this->entries[$id];
        }
        if ($factory === null) {
            throw new NotFoundException('Container entry "' . $id . '" is not available.', 1519978105);
        }
        // if ($factory === false)
        throw new ContainerException('Container entry "' . $id . '" is part of a cyclic dependency chain.', 1520175002);
    }

    /**
     * @param string $id
     * @return mixed
     */
    public function get($id)
    {
        return $this->entries[$id] ?? $this->create($id);
    }
}
