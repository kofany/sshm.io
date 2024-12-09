<?php
/**
 * MasterAccountApiTest
 * PHP version 5
 *
 * @category Class
 * @package  Brevo\Client
 * @author   Swagger Codegen team
 * @link     https://github.com/swagger-api/swagger-codegen
 */

/**
 * Brevo API
 *
 * Brevo provide a RESTFul API that can be used with any languages. With this API, you will be able to :   - Manage your campaigns and get the statistics   - Manage your contacts   - Send transactional Emails and SMS   - and much more...  You can download our wrappers at https://github.com/orgs/brevo  **Possible responses**   | Code | Message |   | :-------------: | ------------- |   | 200  | OK. Successful Request  |   | 201  | OK. Successful Creation |   | 202  | OK. Request accepted |   | 204  | OK. Successful Update/Deletion  |   | 400  | Error. Bad Request  |   | 401  | Error. Authentication Needed  |   | 402  | Error. Not enough credit, plan upgrade needed  |   | 403  | Error. Permission denied  |   | 404  | Error. Object does not exist |   | 405  | Error. Method not allowed  |   | 406  | Error. Not Acceptable  |
 *
 * OpenAPI spec version: 3.0.0
 * Contact: contact@brevo.com
 * Generated by: https://github.com/swagger-api/swagger-codegen.git
 * Swagger Codegen version: 2.4.29
 */

/**
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen
 * Please update the test case below to test the endpoint.
 */

namespace Brevo\Client;

use \Brevo\Client\Configuration;
use \Brevo\Client\ApiException;
use \Brevo\Client\ObjectSerializer;

/**
 * MasterAccountApiTest Class Doc Comment
 *
 * @category Class
 * @package  Brevo\Client
 * @author   Swagger Codegen team
 * @link     https://github.com/swagger-api/swagger-codegen
 */
class MasterAccountApiTest extends \PHPUnit_Framework_TestCase
{

    /**
     * Setup before running any test cases
     */
    public static function setUpBeforeClass()
    {
    }

    /**
     * Setup before running each test case
     */
    public function setUp()
    {
    }

    /**
     * Clean up after running each test case
     */
    public function tearDown()
    {
    }

    /**
     * Clean up after running all test cases
     */
    public static function tearDownAfterClass()
    {
    }

    /**
     * Test case for corporateGroupIdPut
     *
     * Update a group of sub-accounts.
     *
     */
    public function testCorporateGroupIdPut()
    {
    }

    /**
     * Test case for corporateGroupPost
     *
     * Create a new group of sub-accounts.
     *
     */
    public function testCorporateGroupPost()
    {
    }

    /**
     * Test case for corporateMasterAccountGet
     *
     * Get the details of requested master account.
     *
     */
    public function testCorporateMasterAccountGet()
    {
    }

    /**
     * Test case for corporateSubAccountGet
     *
     * Get the list of all the sub-accounts of the master account..
     *
     */
    public function testCorporateSubAccountGet()
    {
    }

    /**
     * Test case for corporateSubAccountIdApplicationsTogglePut
     *
     * Enable/disable sub-account application(s).
     *
     */
    public function testCorporateSubAccountIdApplicationsTogglePut()
    {
    }

    /**
     * Test case for corporateSubAccountIdDelete
     *
     * Delete a sub-account.
     *
     */
    public function testCorporateSubAccountIdDelete()
    {
    }

    /**
     * Test case for corporateSubAccountIdGet
     *
     * Get sub-account details.
     *
     */
    public function testCorporateSubAccountIdGet()
    {
    }

    /**
     * Test case for corporateSubAccountIdPlanPut
     *
     * Update sub-account plan.
     *
     */
    public function testCorporateSubAccountIdPlanPut()
    {
    }

    /**
     * Test case for corporateSubAccountKeyPost
     *
     * Create an API key for a sub-account.
     *
     */
    public function testCorporateSubAccountKeyPost()
    {
    }

    /**
     * Test case for corporateSubAccountPost
     *
     * Create a new sub-account under a master account..
     *
     */
    public function testCorporateSubAccountPost()
    {
    }

    /**
     * Test case for corporateSubAccountSsoTokenPost
     *
     * Generate SSO token to access Brevo.
     *
     */
    public function testCorporateSubAccountSsoTokenPost()
    {
    }

    /**
     * Test case for corporateUserRevokeEmailDelete
     *
     * Revoke an admin user.
     *
     */
    public function testCorporateUserRevokeEmailDelete()
    {
    }

    /**
     * Test case for getAccountActivity
     *
     * Get user activity logs.
     *
     */
    public function testGetAccountActivity()
    {
    }

    /**
     * Test case for getCorporateInvitedUsersList
     *
     * Get the list of all admin users.
     *
     */
    public function testGetCorporateInvitedUsersList()
    {
    }

    /**
     * Test case for getSubAccountGroups
     *
     * Get the list of groups.
     *
     */
    public function testGetSubAccountGroups()
    {
    }

    /**
     * Test case for inviteAdminUser
     *
     * Send invitation to an admin user.
     *
     */
    public function testInviteAdminUser()
    {
    }
}