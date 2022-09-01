//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


contract Whitelist {

    // 允许的最大白名单地址数
    uint8 public maxWhitelistedAddresses;

    // 创建 whitelistedAddresses 的映射
    // 如果地址被列入白名单，我们会将其设置为 true，对于所有其他地址默认为 false。
    mapping(address => bool) public whitelistedAddresses;

    // numAddressesWhitelisted 将用于跟踪有多少地址被列入白名单
    // 注意：不要更改此变量名，因为它将是验证的一部分
    uint8 public numAddressesWhitelisted;

    // 设置白名单地址的最大数量
    // 用户将在部署时放置该值
    constructor(uint8 _maxWhitelistedAddresses) {
        maxWhitelistedAddresses =  _maxWhitelistedAddresses;
    }

    /**
        addAddressToWhitelist - 此函数将发送者的地址添加到白名单
     */
    function addAddressToWhitelist() public {
        // 检查用户是否已被列入白名单
        require(!whitelistedAddresses[msg.sender], "Sender has already been whitelisted");
        // 检查是否 numAddressesWhitelisted < maxWhitelistedAddresses，如果不是则抛出错误。
        require(numAddressesWhitelisted < maxWhitelistedAddresses, "More addresses cant be added, limit reached");
        // 将调用函数的地址添加到 whitelistedAddress 数组
        whitelistedAddresses[msg.sender] = true;
        // 增加白名单地址数量
        numAddressesWhitelisted += 1;
    }

}