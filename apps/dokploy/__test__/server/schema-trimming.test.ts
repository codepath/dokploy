import { describe, it, expect } from 'vitest';
import { apiCreateServer, apiUpdateServer } from '@dokploy/server/db/schema/server';

describe('Server Schema IP Address Trimming', () => {
  it('should trim whitespace from IP address in apiCreateServer', () => {
    const testData = {
      name: 'Test Server',
      description: 'Testing schema trimming',
      ipAddress: '  192.168.1.100  ', // IP with leading and trailing spaces
      port: 22,
      username: 'root',
      sshKeyId: 'test-ssh-key-id'
    };

    const result = apiCreateServer.parse(testData);
    
    expect(result.ipAddress).toBe('192.168.1.100');
    expect(result.name).toBe('Test Server');
    expect(result.port).toBe(22);
  });

  it('should trim whitespace from IP address in apiUpdateServer', () => {
    const testData = {
      name: 'Test Server',
      description: 'Testing schema trimming',
      serverId: 'test-server-id',
      ipAddress: '  192.168.1.100  ', // IP with leading and trailing spaces
      port: 22,
      username: 'root',
      sshKeyId: 'test-ssh-key-id'
    };

    const result = apiUpdateServer.parse(testData);
    
    expect(result.ipAddress).toBe('192.168.1.100');
    expect(result.serverId).toBe('test-server-id');
    expect(result.name).toBe('Test Server');
  });

  it('should handle empty string IP address', () => {
    const testData = {
      name: 'Test Server',
      description: 'Testing schema trimming',
      ipAddress: '', // Empty string
      port: 22,
      username: 'root',
      sshKeyId: 'test-ssh-key-id'
    };

    const result = apiCreateServer.parse(testData);
    
    expect(result.ipAddress).toBe('');
  });

  it('should handle IP address with only spaces', () => {
    const testData = {
      name: 'Test Server',
      description: 'Testing schema trimming',
      ipAddress: '   ', // Only spaces
      port: 22,
      username: 'root',
      sshKeyId: 'test-ssh-key-id'
    };

    const result = apiCreateServer.parse(testData);
    
    expect(result.ipAddress).toBe('');
  });
});
